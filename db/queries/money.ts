import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  accounts,
  categories,
  contexts,
  fxRates,
  goalContributions,
  goals,
  motives,
  recurringRules,
  settings,
  transactions,
} from "@/db/schema";
import { calendarDate, type CalendarDate } from "@/core/date";
import { money, type CurrencyCode, type FxRate, type Money } from "@/core/money";
import type { Account, MoneyRule, ProjectionInput, Transaction } from "@/core/projection";

/**
 * ORBIT — чтение денег из базы.
 *
 * Единственное место, где строки Postgres превращаются в типы `core/`.
 * Ядро не знает ни о Drizzle, ни о том, что суммы лежат в bigint: оно получает
 * `Money` и `CalendarDate`. Всё преобразование — здесь, и нигде больше.
 */

/** `date` в Postgres приезжает строкой "YYYY-MM-DD" — ровно наш CalendarDate. */
function toDate(value: string): CalendarDate {
  return calendarDate(value);
}

export interface Dictionary {
  id: string;
  name: string;
  colorRole: string | null;
}

export interface CategoryRow extends Dictionary {
  direction: "in" | "out";
  parentId: string | null;
}

export interface UserSettings {
  primaryCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  timezone: string;
  weekStart: number;
  cashBuffer: Money;
}

/** Значения по умолчанию — если строки настроек ещё нет. Не выдумка, а тот же
 *  набор, что стоит в `default` у столбцов схемы. */
const FALLBACK_SETTINGS: UserSettings = {
  primaryCurrency: "UZS",
  displayCurrency: "UZS",
  timezone: "Asia/Tashkent",
  weekStart: 1,
  cashBuffer: money(0, "UZS"),
};

export async function loadSettings(userId: string): Promise<UserSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) return FALLBACK_SETTINGS;

  return {
    primaryCurrency: row.primaryCurrency,
    displayCurrency: row.displayCurrency,
    timezone: row.timezone,
    weekStart: row.weekStart,
    cashBuffer: money(row.cashBufferMinor, row.primaryCurrency),
  };
}

export interface AccountRow extends Account {
  name: string;
  kind: "cash" | "card" | "savings" | "business";
}

export async function loadAccounts(userId: string): Promise<AccountRow[]> {
  const rows = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(accounts.orderKey, accounts.createdAt);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    currency: row.currency,
    openingBalance: money(row.openingBalanceMinor, row.currency),
    archived: row.archived,
  }));
}

export interface TransactionRow extends Transaction {
  currency: CurrencyCode;
  categoryId: string | null;
  contextId: string | null;
  motiveId: string | null;
  place: string | null;
  note: string | null;
}

/**
 * Операции за период — для аналитики по срезам.
 *
 * Замещённые версии (`superseded_by`) читаем тоже: движок проекций сам их
 * пропускает, а истории правок иначе не видно. Отбрасывать их здесь означало бы
 * решить за интерфейс, что он не покажет, откуда взялась текущая сумма.
 */
export async function loadTransactions(
  userId: string,
  from: CalendarDate,
  to: CalendarDate,
): Promise<TransactionRow[]> {
  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredOn, from),
        lte(transactions.occurredOn, to),
      ),
    )
    .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt));

  return rows.map(toTransaction);
}

/**
 * ВЕСЬ факт по конец окна — то, что нужно движку проекций.
 *
 * Именно весь, а не срез: `project` считает остаток от начального баланса
 * счетов и сворачивает в него каждую операцию ДО начала окна. Отдать движку
 * только последний месяц значит объявить, что до него денег не двигалось,
 * и получить красивый, но выдуманный остаток.
 *
 * Когда операций станет десятки тысяч, лечится снимком дневного остатка на
 * дату, а не урезанием выборки. До тех пор — честный полный проход.
 */
export async function loadTransactionsThrough(
  userId: string,
  to: CalendarDate,
): Promise<TransactionRow[]> {
  const rows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, userId), lte(transactions.occurredOn, to)))
    .orderBy(transactions.occurredOn);

  return rows.map(toTransaction);
}

/** Последние операции — для ленты на экране ДЕНЬГИ. Замещённых тут нет. */
export async function loadRecentTransactions(
  userId: string,
  limit = 40,
): Promise<TransactionRow[]> {
  const rows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, userId), isNull(transactions.supersededBy)))
    .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt))
    .limit(limit);

  return rows.map(toTransaction);
}

function toTransaction(row: typeof transactions.$inferSelect): TransactionRow {
  return {
    id: row.id,
    accountId: row.accountId,
    occurredOn: toDate(row.occurredOn),
    amount: money(row.amountMinor, row.currency),
    direction: row.direction,
    currency: row.currency,
    categoryId: row.categoryId,
    contextId: row.contextId,
    motiveId: row.motiveId,
    place: row.place,
    note: row.note,
    ruleId: row.ruleId,
    supersededBy: row.supersededBy,
  };
}

export interface RuleRow extends MoneyRule {
  name: string;
  categoryId: string | null;
  contextId: string | null;
  motiveId: string | null;
  active: boolean;
}

export async function loadRules(userId: string): Promise<RuleRow[]> {
  const rows = await db
    .select()
    .from(recurringRules)
    .where(eq(recurringRules.userId, userId))
    .orderBy(recurringRules.createdAt);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    accountId: row.accountId,
    amount: money(row.amountMinor, row.currency),
    direction: row.direction,
    cadence: row.cadence,
    interval: row.interval,
    anchorDate: toDate(row.anchorDate),
    // smallint[] приезжает массивом чисел. null и пустой массив — разные вещи:
    // null означает «день недели берём у якоря», см. core/recurrence.
    weekdayMask: row.weekdayMask ?? undefined,
    dayOfMonth: row.dayOfMonth ?? undefined,
    endsOn: row.endsOn ? toDate(row.endsOn) : undefined,
    endsAfterN: row.endsAfterN ?? undefined,
    categoryId: row.categoryId,
    contextId: row.contextId,
    motiveId: row.motiveId,
    active: row.active,
  }));
}

export async function loadRates(userId: string): Promise<FxRate[]> {
  const rows = await db
    .select()
    .from(fxRates)
    .where(eq(fxRates.userId, userId))
    .orderBy(desc(fxRates.effectiveOn));

  return rows.map((row) => ({
    base: row.base,
    quote: row.quote,
    rate: row.rate,
    effectiveOn: row.effectiveOn,
  }));
}

export interface Dictionaries {
  categories: CategoryRow[];
  contexts: Dictionary[];
  motives: Dictionary[];
}

export async function loadDictionaries(userId: string): Promise<Dictionaries> {
  const [categoryRows, contextRows, motiveRows] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.archived, false)))
      .orderBy(categories.orderKey, categories.id),
    db
      .select()
      .from(contexts)
      .where(eq(contexts.userId, userId))
      .orderBy(contexts.orderKey, contexts.id),
    db
      .select()
      .from(motives)
      .where(eq(motives.userId, userId))
      .orderBy(motives.orderKey, motives.id),
  ]);

  return {
    categories: categoryRows.map((row) => ({
      id: row.id,
      name: row.name,
      direction: row.direction,
      parentId: row.parentId,
      colorRole: row.colorRole,
    })),
    contexts: contextRows.map((row) => ({
      id: row.id,
      name: row.name,
      colorRole: row.colorRole,
    })),
    motives: motiveRows.map((row) => ({
      id: row.id,
      name: row.name,
      colorRole: row.colorRole,
    })),
  };
}

export interface MoneySnapshot {
  input: ProjectionInput;
  accounts: AccountRow[];
  rules: RuleRow[];
  settings: UserSettings;
}

/**
 * Всё, что нужно движку проекций, одним заходом.
 *
 * Запросы параллельные: они независимы, а последовательные ждали бы друг друга
 * по кругу света до Франкфурта и обратно — четыре раза вместо одного.
 */
export async function loadMoneySnapshot(
  userId: string,
  from: CalendarDate,
  to: CalendarDate,
): Promise<MoneySnapshot> {
  const [accountRows, transactionRows, ruleRows, rateRows, userSettings] =
    await Promise.all([
      loadAccounts(userId),
      loadTransactionsThrough(userId, to),
      loadRules(userId),
      loadRates(userId),
      loadSettings(userId),
    ]);

  return {
    accounts: accountRows,
    rules: ruleRows,
    settings: userSettings,
    input: {
      from,
      to,
      accounts: accountRows,
      transactions: transactionRows,
      // Выключенное правило не участвует в будущем, но остаётся в списке:
      // выключить — не то же самое, что удалить.
      rules: ruleRows.filter((rule) => rule.active),
      rates: rateRows,
      currency: userSettings.displayCurrency,
    },
  };
}

export interface GoalRow {
  id: string;
  title: string;
  target: Money;
  saved: Money;
  targetDate: CalendarDate | null;
  priority: number;
}

/**
 * Цели с уже собранной суммой.
 *
 * Собранное — сумма взносов, а не отдельное поле. Поле пришлось бы обновлять
 * при каждом взносе, и однажды оно разошлось бы с историей; сумма по взносам
 * разойтись не может.
 */
export async function loadGoals(userId: string): Promise<GoalRow[]> {
  const rows = await db
    .select({
      id: goals.id,
      title: goals.title,
      targetMinor: goals.targetMinor,
      currency: goals.currency,
      targetDate: goals.targetDate,
      priority: goals.priority,
      savedMinor: sql<number>`coalesce(sum(${goalContributions.amountMinor}), 0)`,
    })
    .from(goals)
    .leftJoin(goalContributions, eq(goalContributions.goalId, goals.id))
    .where(and(eq(goals.userId, userId), eq(goals.status, "active")))
    .groupBy(goals.id)
    .orderBy(desc(goals.priority), goals.createdAt);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    target: money(row.targetMinor, row.currency),
    // sum() в Postgres возвращает numeric, а драйвер отдаёт его строкой:
    // Number здесь обязателен, иначе в Money попадёт "0" и арифметика поедет.
    saved: money(Number(row.savedMinor), row.currency),
    targetDate: row.targetDate ? toDate(row.targetDate) : null,
    priority: row.priority,
  }));
}
