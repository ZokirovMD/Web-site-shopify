/**
 * ORBIT — календарные даты.
 *
 * Дата здесь — это ДЕНЬ, а не момент времени. «5-го числа приходит стипендия»
 * не имеет часа, часового пояса и перехода на летнее время, и попытка хранить
 * такое в Date приводит к классическому багу: операция уезжает на день назад
 * у пользователя восточнее Гринвича.
 *
 * Поэтому CalendarDate — строка "YYYY-MM-DD", а вся арифметика ведётся в UTC-полдень,
 * куда не дотягивается ни один сдвиг пояса.
 *
 * Чистый модуль: не знает ни о React, ни о базе.
 */

export type CalendarDate = string & { readonly __brand: "CalendarDate" };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function calendarDate(value: string): CalendarDate {
  if (!ISO.test(value)) {
    throw new RangeError(`Ожидается дата вида YYYY-MM-DD, получено "${value}".`);
  }
  return value as CalendarDate;
}

/** Полдень UTC: любой сдвиг пояса до ±12 часов остаётся внутри тех же суток. */
function toUtc(date: CalendarDate): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}

function fromUtc(date: Date): CalendarDate {
  const y = date.getUTCFullYear().toString().padStart(4, "0");
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}` as CalendarDate;
}

export function today(now: Date = new Date()): CalendarDate {
  const y = now.getFullYear().toString().padStart(4, "0");
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}` as CalendarDate;
}

/**
 * Сегодня В ЗАДАННОМ ПОЯСЕ, а не в поясе машины.
 *
 * Это не придирка. Сервер на Vercel живёт в UTC, владелец — в Ташкенте,
 * UTC+5. С полуночи до пяти утра по Ташкенту `today()` на сервере вернёт
 * вчерашний день, а в браузере — сегодняшний: проекция посчитается от разных
 * дат, и React сверх того сообщит о рассинхроне разметки.
 *
 * Пояс приходит снаружи (сейчас из настроек next-intl, позже — из таблицы
 * settings): модуль остаётся чистым и ничего не знает об источнике.
 */
export function todayIn(timeZone: string, now: Date = new Date()): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item) => item.type === type)?.value ?? "";

  return calendarDate(
    `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`,
  );
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** Последний день месяца — нужен, чтобы правило «31-го числа» не теряло февраль. */
export function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
}

/**
 * Прибавление месяцев с ЗАЖИМОМ дня.
 *
 * 31 января + 1 месяц = 28 (или 29) февраля, а не 3 марта.
 * Нативный Date переполняет месяц, и правило «плачу 31-го» после февраля
 * навсегда съезжало бы на начало марта.
 */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const d = toUtc(date);
  const day = d.getUTCDate();
  const targetMonth = d.getUTCMonth() + months;

  const probe = new Date(Date.UTC(d.getUTCFullYear(), targetMonth, 1, 12));
  const maxDay = lastDayOfMonth(probe.getUTCFullYear(), probe.getUTCMonth());

  probe.setUTCDate(Math.min(day, maxDay));
  return fromUtc(probe);
}

export function addYears(date: CalendarDate, years: number): CalendarDate {
  return addMonths(date, years * 12);
}

export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  const ms = toUtc(to).getTime() - toUtc(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** 0 — воскресенье, 1 — понедельник, … 6 — суббота. */
export function weekday(date: CalendarDate): number {
  return toUtc(date).getUTCDay();
}

export function dayOfMonth(date: CalendarDate): number {
  return toUtc(date).getUTCDate();
}

export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isBefore(a: CalendarDate, b: CalendarDate): boolean {
  return a < b;
}

export function isAfter(a: CalendarDate, b: CalendarDate): boolean {
  return a > b;
}

export function isSameOrBefore(a: CalendarDate, b: CalendarDate): boolean {
  return a <= b;
}

/** Все дни включительно. Порядок возрастающий. */
export function eachDay(from: CalendarDate, to: CalendarDate): CalendarDate[] {
  if (isAfter(from, to)) return [];
  const days: CalendarDate[] = [];
  let cursor = from;
  while (isSameOrBefore(cursor, to)) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}
