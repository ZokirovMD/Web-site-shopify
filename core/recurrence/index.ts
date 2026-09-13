/**
 * ORBIT — разворачивание повторяющихся правил в конкретные даты.
 *
 * Ключевое архитектурное решение (docs/SYSTEM.md §4): правило НЕ создаёт строк
 * в базе заранее. Оно разворачивается в виртуальные события на лету, в пределах
 * горизонта расчёта. Когда дата наступает, материализатор пишет настоящую строку —
 * и её можно поправить, если в реальности сумма оказалась другой.
 *
 * База не раздувается, история остаётся правдой, будущее остаётся расчётом.
 *
 * Чистый модуль.
 */

import {
  addDays,
  addMonths,
  addYears,
  compareDates,
  dayOfMonth,
  isAfter,
  isBefore,
  isSameOrBefore,
  lastDayOfMonth,
  weekday,
  type CalendarDate,
} from "@/core/date";

export type Cadence = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringRule {
  id: string;
  cadence: Cadence;
  /** Каждые N единиц: 1 — каждый день/неделю/месяц, 2 — через один. */
  interval: number;
  /** С какой даты правило действует. */
  anchorDate: CalendarDate;
  /** Для weekly: дни недели, 0 — воскресенье. Пусто — день недели якоря. */
  weekdayMask?: readonly number[];
  /** Для monthly: число месяца. Пусто — число якоря. 31 зажимается до конца месяца. */
  dayOfMonth?: number;
  /** Правило перестаёт действовать после этой даты включительно. */
  endsOn?: CalendarDate;
  /** Правило срабатывает не более N раз от якоря. */
  endsAfterN?: number;
  active?: boolean;
}

/** Защита от бесконечного цикла на кривом правиле. */
const MAX_OCCURRENCES = 10_000;

/**
 * Все даты срабатывания правила в окне [from, to] включительно.
 * Результат отсортирован по возрастанию и не содержит дубликатов.
 */
export function occurrences(
  rule: RecurringRule,
  from: CalendarDate,
  to: CalendarDate,
): CalendarDate[] {
  if (rule.active === false) return [];
  if (isAfter(from, to)) return [];
  if (rule.interval < 1 || !Number.isInteger(rule.interval)) {
    throw new RangeError(`Интервал правила должен быть целым от 1, получено ${rule.interval}.`);
  }

  const limit = rule.endsOn && isBefore(rule.endsOn, to) ? rule.endsOn : to;
  const found: CalendarDate[] = [];
  let count = 0;

  const push = (date: CalendarDate): boolean => {
    count += 1;
    if (rule.endsAfterN !== undefined && count > rule.endsAfterN) return false;
    if (isSameOrBefore(from, date)) found.push(date);
    return true;
  };

  if (rule.cadence === "weekly") {
    const mask =
      rule.weekdayMask && rule.weekdayMask.length > 0
        ? [...rule.weekdayMask].sort((a, b) => a - b)
        : [weekday(rule.anchorDate)];

    // начало недели якоря (воскресенье), чтобы интервал считался по неделям
    let weekStart = addDays(rule.anchorDate, -weekday(rule.anchorDate));
    let guard = 0;

    while (isSameOrBefore(weekStart, limit) && guard < MAX_OCCURRENCES) {
      for (const day of mask) {
        const date = addDays(weekStart, day);
        if (isBefore(date, rule.anchorDate)) continue;
        if (isAfter(date, limit)) continue;
        if (!push(date)) return dedupe(found);
      }
      weekStart = addDays(weekStart, 7 * rule.interval);
      guard += 1;
    }

    return dedupe(found);
  }

  let cursor = rule.anchorDate;
  let guard = 0;

  while (isSameOrBefore(cursor, limit) && guard < MAX_OCCURRENCES) {
    if (!push(cursor)) return dedupe(found);

    if (rule.cadence === "daily") {
      cursor = addDays(cursor, rule.interval);
    } else if (rule.cadence === "monthly") {
      cursor = nextMonthly(rule, cursor);
    } else {
      cursor = addYears(cursor, rule.interval);
    }
    guard += 1;
  }

  return dedupe(found);
}

/**
 * Следующее месячное срабатывание.
 *
 * Считается ОТ ЯКОРЯ, а не от предыдущего результата: иначе правило «31-го числа»
 * после зажима в феврале навсегда осталось бы 28-м. Якорь помнит настоящее число.
 */
function nextMonthly(rule: RecurringRule, current: CalendarDate): CalendarDate {
  const wanted = rule.dayOfMonth ?? dayOfMonth(rule.anchorDate);
  const monthsFromAnchor = monthDistance(rule.anchorDate, current);
  const target = addMonths(rule.anchorDate, (monthsFromAnchor + rule.interval));

  const [y, m] = target.split("-").map(Number) as [number, number];
  const maxDay = lastDayOfMonth(y, m - 1);
  const day = Math.min(wanted, maxDay);

  return `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}` as CalendarDate;
}

function monthDistance(from: CalendarDate, to: CalendarDate): number {
  const [fy, fm] = from.split("-").map(Number) as [number, number];
  const [ty, tm] = to.split("-").map(Number) as [number, number];
  return (ty - fy) * 12 + (tm - fm);
}

function dedupe(dates: CalendarDate[]): CalendarDate[] {
  const seen = new Set<string>();
  const out: CalendarDate[] = [];
  for (const date of dates) {
    if (seen.has(date)) continue;
    seen.add(date);
    out.push(date);
  }
  return out.sort(compareDates);
}
