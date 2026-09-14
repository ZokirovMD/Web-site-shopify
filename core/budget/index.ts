/**
 * ORBIT — бюджеты.
 *
 * «Сколько я должен тратить в месяц» — владелец вписывает лимит, система
 * следит за темпом и говорит не «ты превысил», а **когда превысишь при текущем
 * темпе**. Предупреждение после факта бесполезно: деньги уже потрачены.
 *
 * Чистый модуль.
 */

import { addDays, daysBetween, type CalendarDate } from "@/core/date";
import { money, subtract, type CurrencyCode, type Money } from "@/core/money";
import { inPeriod, type Period, type Spend } from "@/core/analytics";

export interface Budget {
  id: string;
  /** Пусто — общий лимит на всё. Иначе лимит на категорию. */
  categoryId?: string | null;
  limit: Money;
  period: "month";
}

export type BudgetHealth = "ok" | "tight" | "over";

export interface BudgetStatus {
  budget: Budget;
  spent: Money;
  remaining: Money;
  /** Доля израсходованного, 0..1+. Может быть больше единицы. */
  used: number;
  /** Средний расход в день с начала периода. */
  pace: Money;
  /** Сколько можно тратить в день до конца периода, чтобы уложиться. */
  allowancePerDay: Money;
  /** Когда лимит кончится при текущем темпе. null — не кончится до конца периода. */
  overrunOn: CalendarDate | null;
  health: BudgetHealth;
}

/**
 * Состояние бюджета на дату `asOf`.
 *
 * Темп считается от НАЧАЛА периода до `asOf` включительно, а не за всё окно:
 * иначе первый день месяца всегда показывал бы катастрофу, а последний —
 * ложное спокойствие.
 */
export function budgetStatus(
  budget: Budget,
  spends: readonly Spend[],
  options: Period & { asOf: CalendarDate; currency: CurrencyCode },
): BudgetStatus {
  const { asOf, currency } = options;

  const spentMinor = spends.reduce((acc, spend) => {
    if (spend.direction !== "out") return acc;
    if (!inPeriod(spend.occurredOn, options)) return acc;
    if (spend.occurredOn > asOf) return acc;
    if (budget.categoryId && !matchesCategory(spend.categoryId, budget.categoryId)) return acc;
    return acc + spend.amount.amount;
  }, 0);

  const spent = money(spentMinor, currency);
  const remaining = subtract(budget.limit, spent);

  const elapsedDays = Math.max(1, daysBetween(options.from, asOf) + 1);
  const totalDays = Math.max(1, daysBetween(options.from, options.to) + 1);
  const daysLeft = Math.max(0, totalDays - elapsedDays);

  const paceMinor = Math.round(spentMinor / elapsedDays);
  const pace = money(paceMinor, currency);

  const allowancePerDay = money(
    daysLeft === 0 ? 0 : Math.max(0, Math.floor(remaining.amount / daysLeft)),
    currency,
  );

  let overrunOn: CalendarDate | null = null;
  if (remaining.amount < 0) {
    overrunOn = asOf;
  } else if (paceMinor > 0) {
    const daysUntilOverrun = Math.floor(remaining.amount / paceMinor);
    if (daysUntilOverrun <= daysLeft) {
      overrunOn = addDays(asOf, daysUntilOverrun + 1);
    }
  }

  const used = budget.limit.amount === 0 ? 0 : spentMinor / budget.limit.amount;

  const health: BudgetHealth =
    remaining.amount < 0 ? "over" : overrunOn !== null || used >= 0.8 ? "tight" : "ok";

  return { budget, spent, remaining, used, pace, allowancePerDay, overrunOn, health };
}

/**
 * Лимит на "food" покрывает и "food.cafe": иначе пришлось бы заводить бюджет
 * на каждый лист дерева, и владелец бросил бы это на третий день.
 */
function matchesCategory(spendCategory: string | null | undefined, budgetCategory: string): boolean {
  if (!spendCategory) return false;
  return spendCategory === budgetCategory || spendCategory.startsWith(`${budgetCategory}.`);
}

/** Границы календарного месяца, в котором лежит дата. */
export function monthBounds(date: CalendarDate): Period {
  const [year, month] = date.split("-") as [string, string];
  const last = new Date(Date.UTC(Number(year), Number(month), 0, 12)).getUTCDate();
  return {
    from: `${year}-${month}-01` as CalendarDate,
    to: `${year}-${month}-${last.toString().padStart(2, "0")}` as CalendarDate,
  };
}
