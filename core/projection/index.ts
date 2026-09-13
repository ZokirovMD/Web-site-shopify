/**
 * ORBIT — движок проекций. Ядро продукта.
 *
 * «Проекция считает будущее вперёд»: владелец один раз объявляет правило —
 * «каждый день уходит 50 000», «стипендия 5-го числа» — и все модули читают
 * из ОДНОГО расчёта. Цели сами знают дату закрытия, дашборд сам знает,
 * во сколько обходится сегодняшний день, смета бизнеса сама знает, когда соберётся.
 *
 * Чистый модуль: без базы, без сети, без React. Любую функцию можно вызвать
 * в тесте одной строкой — потому что от её правильности зависит всё остальное.
 */

import {
  eachDay,
  isSameOrBefore,
  type CalendarDate,
} from "@/core/date";
import { occurrences, type RecurringRule } from "@/core/recurrence";
import {
  add,
  convert,
  money,
  subtract,
  type CurrencyCode,
  type FxRate,
  type Money,
} from "@/core/money";

export type Direction = "in" | "out";

export interface Account {
  id: string;
  currency: CurrencyCode;
  openingBalance: Money;
  archived?: boolean;
}

/** Настоящая операция. Факт. */
export interface Transaction {
  id: string;
  accountId: string;
  occurredOn: CalendarDate;
  amount: Money;
  direction: Direction;
  /** Правка создаёт новую версию, а не затирает старую. Замещённые пропускаются. */
  supersededBy?: string | null;
  /**
   * Правило, которое породило эту операцию при материализации.
   * По нему проекция понимает, что виртуальное срабатывание уже стало фактом,
   * и не считает его дважды.
   */
  ruleId?: string | null;
}

/** Повторяющееся правило с деньгами. Разворачивается в виртуальные операции. */
export interface MoneyRule extends RecurringRule {
  accountId: string;
  amount: Money;
  direction: Direction;
}

export interface DailyBalance {
  date: CalendarDate;
  inflow: Money;
  outflow: Money;
  /** Остаток на конец дня. Это и есть ответ на «сколько у меня будет». */
  closing: Money;
}

export interface ProjectionInput {
  from: CalendarDate;
  to: CalendarDate;
  accounts: readonly Account[];
  transactions: readonly Transaction[];
  rules: readonly MoneyRule[];
  rates: readonly FxRate[];
  /** Валюта расчёта. Всё приводится к ней по курсу из данных. */
  currency: CurrencyCode;
}

/**
 * Дневные остатки на всём горизонте.
 *
 * Факт и правила складываются в один поток. Если на дату есть и настоящая операция,
 * и срабатывание правила, которое её породило, — правило НЕ дублируется:
 * материализованная операция ссылается на правило через ruleId.
 */
export function project(input: ProjectionInput): DailyBalance[] {
  const { from, to, accounts, transactions, rules, rates, currency } = input;

  const zero = money(0, currency);
  const live = accounts.filter((a) => !a.archived);

  let running = live.reduce(
    (sum, account) => add(sum, convert(account.openingBalance, currency, rates)),
    zero,
  );

  // факт до начала окна уже отражён в остатке
  const byDate = new Map<CalendarDate, { inflow: Money; outflow: Money }>();
  const bucket = (date: CalendarDate) => {
    let cell = byDate.get(date);
    if (!cell) {
      cell = { inflow: zero, outflow: zero };
      byDate.set(date, cell);
    }
    return cell;
  };

  const accountIds = new Set(live.map((a) => a.id));
  /** Даты, на которые правило уже материализовано в настоящую операцию. */
  const materialized = new Set<string>();

  for (const tx of transactions) {
    if (tx.supersededBy) continue;
    if (!accountIds.has(tx.accountId)) continue;

    const amount = convert(tx.amount, currency, rates);

    if (tx.occurredOn < from) {
      running = tx.direction === "in" ? add(running, amount) : subtract(running, amount);
      continue;
    }
    if (!isSameOrBefore(tx.occurredOn, to)) continue;

    const cell = bucket(tx.occurredOn);
    if (tx.direction === "in") cell.inflow = add(cell.inflow, amount);
    else cell.outflow = add(cell.outflow, amount);
  }

  for (const tx of transactions) {
    if (!tx.supersededBy && tx.ruleId) materialized.add(`${tx.ruleId}@${tx.occurredOn}`);
  }

  for (const rule of rules) {
    if (!accountIds.has(rule.accountId)) continue;
    const amount = convert(rule.amount, currency, rates);

    for (const date of occurrences(rule, from, to)) {
      if (materialized.has(`${rule.id}@${date}`)) continue;
      const cell = bucket(date);
      if (rule.direction === "in") cell.inflow = add(cell.inflow, amount);
      else cell.outflow = add(cell.outflow, amount);
    }
  }

  return eachDay(from, to).map((date) => {
    const cell = byDate.get(date) ?? { inflow: zero, outflow: zero };
    running = subtract(add(running, cell.inflow), cell.outflow);
    return { date, inflow: cell.inflow, outflow: cell.outflow, closing: running };
  });
}

/** Остаток на конкретный день. null, если день вне горизонта расчёта. */
export function balanceOn(series: readonly DailyBalance[], date: CalendarDate): Money | null {
  return series.find((day) => day.date === date)?.closing ?? null;
}

/** Средний расход в день за весь горизонт. */
export function burnRate(series: readonly DailyBalance[], currency: CurrencyCode): Money {
  if (series.length === 0) return money(0, currency);
  const total = series.reduce((sum, day) => sum + day.outflow.amount, 0);
  return money(Math.round(total / series.length), currency);
}

/**
 * Первый день, когда остаток покрывает нужную сумму сверх подушки.
 * Это ответ на «когда я соберу» — и для кроссовок, и для запуска бизнеса.
 * null означает: на этом горизонте не соберётся.
 */
export function fundedOn(
  series: readonly DailyBalance[],
  needed: Money,
  buffer: Money,
): CalendarDate | null {
  const threshold = add(needed, buffer);
  return series.find((day) => day.closing.amount >= threshold.amount)?.date ?? null;
}

/**
 * Сколько можно потратить сегодня, не уронив остаток ниже подушки
 * ни в один день горизонта. Считается по худшему дню, а не по сегодняшнему:
 * иначе система разрешит трату, которая обрушит следующий месяц.
 */
export function safeToSpend(
  series: readonly DailyBalance[],
  buffer: Money,
  currency: CurrencyCode,
): Money {
  if (series.length === 0) return money(0, currency);
  const worst = series.reduce(
    (min, day) => (day.closing.amount < min ? day.closing.amount : min),
    Number.POSITIVE_INFINITY,
  );
  return money(Math.max(0, worst - buffer.amount), currency);
}

/** Первый день, когда остаток уходит в минус. null — не уходит. */
export function firstShortfall(series: readonly DailyBalance[]): CalendarDate | null {
  return series.find((day) => day.closing.amount < 0)?.date ?? null;
}
