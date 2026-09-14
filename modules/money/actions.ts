"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { accounts, recurringRules, transactions } from "@/db/schema";
import { loadDictionaries } from "@/db/queries/money";
import { parseAmount, type CurrencyCode } from "@/core/money";
import { currentUser } from "@/lib/auth/session";

/**
 * ORBIT — запись денег.
 *
 * Границы, которые здесь держатся:
 *   1. Zod на каждом поле: данные пришли из браузера, им нельзя верить.
 *   2. Счёт проверяется на принадлежность владельцу. Без этого чужой id
 *      в скрытом поле формы пишет операцию в чужой счёт.
 *   3. Справочники тоже проверяются. На category_id нет внешнего ключа —
 *      он составной с user_id, — значит проверка наша, и если её не сделать,
 *      в базу ляжет «food.cafe» от другого пользователя или просто мусор.
 *   4. Ошибка возвращается КЛЮЧОМ, фразу подставляет форма (см. i18n).
 */

export type MoneyError =
  | "checkFields"
  | "badAmount"
  | "zeroAmount"
  | "badDate"
  | "unknownAccount"
  | "unknownCategory"
  | "unknownContext"
  | "unknownMotive"
  | "needName"
  | "needAccount";

export interface MoneyFormState {
  error?: MoneyError;
  ok?: boolean;
}

function firstIssue(issues: readonly { message: string }[]): MoneyError {
  return (issues[0]?.message ?? "checkFields") as MoneyError;
}

async function requireUserId(): Promise<string> {
  const user = await currentUser();
  if (!user) redirect("/vhod");
  return user.id;
}

/** Пустая строка из `<select>` без выбора — это «не задано», а не значение. */
const optionalId = z
  .string()
  .trim()
  .max(64)
  .transform((value) => (value === "" ? null : value))
  .nullable();

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable();

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "badDate");

const direction = z.enum(["in", "out"]);

/** Счёт владельца — иначе `unknownAccount`. Возвращает валюту счёта: сумма
 *  всегда в валюте того счёта, по которому прошла. */
async function accountCurrency(
  userId: string,
  accountId: string,
): Promise<CurrencyCode | null> {
  const rows = await db
    .select({ currency: accounts.currency })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .limit(1);
  return rows[0]?.currency ?? null;
}

interface Marks {
  categoryId: string | null;
  contextId: string | null;
  motiveId: string | null;
}

/** Проверка трёх измерений разом: одна выборка справочников вместо трёх. */
async function checkMarks(userId: string, marks: Marks): Promise<MoneyError | null> {
  if (!marks.categoryId && !marks.contextId && !marks.motiveId) return null;

  const dictionaries = await loadDictionaries(userId);
  const has = (list: readonly { id: string }[], id: string | null) =>
    id === null || list.some((item) => item.id === id);

  if (!has(dictionaries.categories, marks.categoryId)) return "unknownCategory";
  if (!has(dictionaries.contexts, marks.contextId)) return "unknownContext";
  if (!has(dictionaries.motives, marks.motiveId)) return "unknownMotive";
  return null;
}

const transactionForm = z.object({
  accountId: z.string().uuid("needAccount"),
  amount: z.string(),
  direction,
  occurredOn: isoDate,
  categoryId: optionalId,
  contextId: optionalId,
  motiveId: optionalId,
  place: optionalText(160),
  note: optionalText(1000),
});

export async function addTransaction(
  _prev: MoneyFormState,
  form: FormData,
): Promise<MoneyFormState> {
  const userId = await requireUserId();

  const parsed = transactionForm.safeParse({
    accountId: form.get("accountId") ?? "",
    amount: form.get("amount") ?? "",
    direction: form.get("direction") ?? "out",
    occurredOn: form.get("occurredOn") ?? "",
    categoryId: form.get("categoryId") ?? "",
    contextId: form.get("contextId") ?? "",
    motiveId: form.get("motiveId") ?? "",
    place: form.get("place") ?? "",
    note: form.get("note") ?? "",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  const data = parsed.data;
  const currency = await accountCurrency(userId, data.accountId);
  if (!currency) return { error: "unknownAccount" };

  const amount = parseAmount(data.amount, currency);
  if (!amount) return { error: "badAmount" };
  // Ноль не операция. Минус тоже: направление задаётся полем, а не знаком,
  // иначе «−500 расход» становится приходом и никто этого не заметит.
  if (amount.amount <= 0) return { error: "zeroAmount" };

  const badMark = await checkMarks(userId, data);
  if (badMark) return { error: badMark };

  await db.insert(transactions).values({
    userId,
    accountId: data.accountId,
    occurredOn: data.occurredOn,
    amountMinor: amount.amount,
    currency,
    direction: data.direction,
    categoryId: data.categoryId,
    contextId: data.contextId,
    motiveId: data.motiveId,
    place: data.place,
    note: data.note,
    source: "manual",
  });

  revalidatePath("/dengi");
  revalidatePath("/");
  return { ok: true };
}

const accountForm = z.object({
  name: z.string().trim().min(1, "needName").max(120),
  kind: z.enum(["cash", "card", "savings", "business"]),
  currency: z.enum(["UZS", "USD"]),
  openingBalance: z.string(),
});

export async function addAccount(
  _prev: MoneyFormState,
  form: FormData,
): Promise<MoneyFormState> {
  const userId = await requireUserId();

  const parsed = accountForm.safeParse({
    name: form.get("name") ?? "",
    kind: form.get("kind") ?? "cash",
    currency: form.get("currency") ?? "UZS",
    openingBalance: form.get("openingBalance") ?? "0",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  const data = parsed.data;
  // Пустое поле начального остатка — это ноль, а не ошибка: счёт можно
  // завести и пустым. А вот «абв» — ошибка.
  const opening =
    data.openingBalance.trim() === ""
      ? 0
      : (parseAmount(data.openingBalance, data.currency)?.amount ?? null);
  if (opening === null) return { error: "badAmount" };

  await db.insert(accounts).values({
    userId,
    name: data.name,
    kind: data.kind,
    currency: data.currency,
    openingBalanceMinor: opening,
    source: "manual",
  });

  revalidatePath("/dengi");
  revalidatePath("/");
  return { ok: true };
}

const ruleForm = z.object({
  name: z.string().trim().min(1, "needName").max(160),
  accountId: z.string().uuid("needAccount"),
  amount: z.string(),
  direction,
  cadence: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.coerce.number().int().min(1).max(365),
  anchorDate: isoDate,
  dayOfMonth: z.coerce.number().int().min(1).max(31).nullable().catch(null),
  categoryId: optionalId,
  contextId: optionalId,
  motiveId: optionalId,
});

export async function addRule(
  _prev: MoneyFormState,
  form: FormData,
): Promise<MoneyFormState> {
  const userId = await requireUserId();

  const rawDay = form.get("dayOfMonth");
  const parsed = ruleForm.safeParse({
    name: form.get("name") ?? "",
    accountId: form.get("accountId") ?? "",
    amount: form.get("amount") ?? "",
    direction: form.get("direction") ?? "out",
    cadence: form.get("cadence") ?? "monthly",
    interval: form.get("interval") ?? 1,
    anchorDate: form.get("anchorDate") ?? "",
    dayOfMonth: rawDay === null || rawDay === "" ? null : rawDay,
    categoryId: form.get("categoryId") ?? "",
    contextId: form.get("contextId") ?? "",
    motiveId: form.get("motiveId") ?? "",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  const data = parsed.data;
  const currency = await accountCurrency(userId, data.accountId);
  if (!currency) return { error: "unknownAccount" };

  const amount = parseAmount(data.amount, currency);
  if (!amount) return { error: "badAmount" };
  if (amount.amount <= 0) return { error: "zeroAmount" };

  const badMark = await checkMarks(userId, data);
  if (badMark) return { error: badMark };

  await db.insert(recurringRules).values({
    userId,
    accountId: data.accountId,
    name: data.name,
    amountMinor: amount.amount,
    currency,
    direction: data.direction,
    cadence: data.cadence,
    interval: data.interval,
    anchorDate: data.anchorDate,
    // Число месяца имеет смысл только у месячного правила. У ежедневного
    // оно молча превратило бы «каждый день» в «раз в месяц».
    dayOfMonth: data.cadence === "monthly" ? data.dayOfMonth : null,
    categoryId: data.categoryId,
    contextId: data.contextId,
    motiveId: data.motiveId,
    source: "manual",
  });

  revalidatePath("/dengi");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Выключить или включить правило.
 *
 * Именно выключить, а не удалить: выключенное правило перестаёт считаться
 * в будущем, но остаётся историей. Удалять то, из чего считались прошлые
 * проекции, — способ однажды не понять собственные цифры.
 */
export async function setRuleActive(id: string, active: boolean): Promise<void> {
  const userId = await requireUserId();

  await db
    .update(recurringRules)
    .set({ active, updatedAt: new Date() })
    .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)));

  revalidatePath("/dengi");
  revalidatePath("/");
}
