/**
 * ORBIT — аналитика по измерениям.
 *
 * Отвечает на вопросы, ради которых траты размечаются четырьмя измерениями:
 *   «сколько ушло на еду с друзьями за полгода»
 *   «сколько я потратил импульсивно за год»
 *   «сколько встреч с семьёй было за последний месяц»
 *
 * Всё это — один механизм: срез по измерению за период. Поэтому и траты,
 * и события календаря размечаются одними и теми же контекстами.
 *
 * Чистый модуль.
 */

import { isSameOrBefore, type CalendarDate } from "@/core/date";
import { money, type CurrencyCode, type Money } from "@/core/money";

/** Измерение, по которому режем. */
export type Dimension = "category" | "context" | "motive";

export interface Spend {
  id: string;
  occurredOn: CalendarDate;
  amount: Money;
  direction: "in" | "out";
  categoryId?: string | null;
  contextId?: string | null;
  motiveId?: string | null;
}

export interface CalendarItem {
  id: string;
  occurredOn: CalendarDate;
  categoryId?: string | null;
  contextId?: string | null;
}

export interface Period {
  from: CalendarDate;
  to: CalendarDate;
}

export interface Slice {
  key: string;
  total: Money;
  count: number;
  /** Доля от всего среза, 0..1. Считается от суммы, а не от количества. */
  share: number;
}

const UNSET = "—";

function dimensionKey(item: Spend | CalendarItem, by: Dimension): string {
  const raw =
    by === "category" ? item.categoryId : by === "context" ? item.contextId : (item as Spend).motiveId;
  return raw ?? UNSET;
}

export function inPeriod(date: CalendarDate, period: Period): boolean {
  return isSameOrBefore(period.from, date) && isSameOrBefore(date, period.to);
}

/**
 * Срез трат по измерению за период.
 * Отсортирован по убыванию суммы: сверху то, что съедает больше всего.
 */
export function breakdown(
  spends: readonly Spend[],
  options: Period & {
    by: Dimension;
    direction?: "in" | "out";
    currency: CurrencyCode;
    /** Свернуть категорию до корневой: "food.cafe" → "food". */
    rollUp?: (id: string) => string;
  },
): Slice[] {
  const { by, direction = "out", currency, rollUp } = options;

  const buckets = new Map<string, { total: number; count: number }>();
  let grand = 0;

  for (const spend of spends) {
    if (spend.direction !== direction) continue;
    if (!inPeriod(spend.occurredOn, options)) continue;

    let key = dimensionKey(spend, by);
    if (rollUp && key !== UNSET) key = rollUp(key);

    const cell = buckets.get(key) ?? { total: 0, count: 0 };
    cell.total += spend.amount.amount;
    cell.count += 1;
    buckets.set(key, cell);
    grand += spend.amount.amount;
  }

  return [...buckets.entries()]
    .map(([key, cell]) => ({
      key,
      total: money(cell.total, currency),
      count: cell.count,
      share: grand === 0 ? 0 : cell.total / grand,
    }))
    .sort((a, b) => b.total.amount - a.total.amount);
}

export interface CountSlice {
  key: string;
  count: number;
  share: number;
}

/**
 * Срез СОБЫТИЙ по измерению за период — «сколько встреч с друзьями за полгода».
 * Здесь важно количество, а не сумма, поэтому отдельная функция, а не флаг.
 */
export function countBy(
  items: readonly CalendarItem[],
  options: Period & { by: Extract<Dimension, "category" | "context"> },
): CountSlice[] {
  const buckets = new Map<string, number>();
  let grand = 0;

  for (const item of items) {
    if (!inPeriod(item.occurredOn, options)) continue;
    const key = dimensionKey(item, options.by);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
    grand += 1;
  }

  return [...buckets.entries()]
    .map(([key, count]) => ({ key, count, share: grand === 0 ? 0 : count / grand }))
    .sort((a, b) => b.count - a.count);
}

export interface MonthTotal {
  /** "YYYY-MM" */
  month: string;
  total: Money;
  count: number;
}

/**
 * Помесячная динамика — для графика «куда уходят деньги» и для сравнения
 * месяца с предыдущим. Месяцы без трат не пропускаются молча: их просто нет
 * в результате, и график сам решает, рисовать ли ноль.
 */
export function monthlyTotals(
  spends: readonly Spend[],
  options: Period & { direction?: "in" | "out"; currency: CurrencyCode; categoryId?: string },
): MonthTotal[] {
  const { direction = "out", currency, categoryId } = options;
  const buckets = new Map<string, { total: number; count: number }>();

  for (const spend of spends) {
    if (spend.direction !== direction) continue;
    if (!inPeriod(spend.occurredOn, options)) continue;
    if (categoryId && spend.categoryId !== categoryId) continue;

    const month = spend.occurredOn.slice(0, 7);
    const cell = buckets.get(month) ?? { total: 0, count: 0 };
    cell.total += spend.amount.amount;
    cell.count += 1;
    buckets.set(month, cell);
  }

  return [...buckets.entries()]
    .map(([month, cell]) => ({ month, total: money(cell.total, currency), count: cell.count }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));
}

/** Итого за период по направлению. */
export function total(
  spends: readonly Spend[],
  options: Period & { direction?: "in" | "out"; currency: CurrencyCode },
): Money {
  const { direction = "out", currency } = options;
  const sum = spends.reduce(
    (acc, spend) =>
      spend.direction === direction && inPeriod(spend.occurredOn, options)
        ? acc + spend.amount.amount
        : acc,
    0,
  );
  return money(sum, currency);
}
