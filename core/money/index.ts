/**
 * ORBIT — деньги.
 *
 * Правило, которое не обсуждается: деньги — ЦЕЛЫЕ числа в минорных единицах.
 * Никогда float. Копейки, потерянные на округлении, — классический баг
 * финансовых приложений, и здесь его не будет.
 *
 * UZS хранится ×100, как и USD, ради единообразия: одно правило на все валюты
 * дешевле, чем таблица исключений.
 *
 * Чистый модуль: не знает ни о React, ни о базе.
 */

export type CurrencyCode = "UZS" | "USD";

export const CURRENCIES: Record<
  CurrencyCode,
  { minorUnits: number; symbol: string; displayFractionDigits: number }
> = {
  /**
   * Хранится ×100 ради единообразия — одно правило на все валюты дешевле,
   * чем таблица исключений. Но НЕ показывается дробным: тийины вышли
   * из оборота, и «66 483,52 сум» на экране — это мусор, а не точность.
   */
  UZS: { minorUnits: 100, symbol: "сум", displayFractionDigits: 0 },
  USD: { minorUnits: 100, symbol: "$", displayFractionDigits: 2 },
};

/** Сумма в минорных единицах. Бренд не даёт перепутать её с обычным числом. */
export type Minor = number & { readonly __brand: "Minor" };

export interface Money {
  amount: Minor;
  currency: CurrencyCode;
}

export function minor(value: number): Minor {
  if (!Number.isInteger(value)) {
    throw new RangeError(
      `Минорные единицы должны быть целыми, получено ${value}. Деньги никогда не float.`,
    );
  }
  return value as Minor;
}

export function money(amount: number, currency: CurrencyCode): Money {
  return { amount: minor(amount), currency };
}

/** Из привычных единиц (сумы, доллары) в минорные. Округление банковское. */
export function fromMajor(value: number, currency: CurrencyCode): Money {
  const units = CURRENCIES[currency].minorUnits;
  return money(Math.round(value * units), currency);
}

export function toMajor(value: Money): number {
  return value.amount / CURRENCIES[value.currency].minorUnits;
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount + b.amount, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount - b.amount, a.currency);
}

export function negate(value: Money): Money {
  return money(-value.amount, value.currency);
}

export function isNegative(value: Money): boolean {
  return value.amount < 0;
}

export function isZero(value: Money): boolean {
  return value.amount === 0;
}

export function compare(a: Money, b: Money): number {
  assertSameCurrency(a, b);
  return a.amount - b.amount;
}

/** Умножение на коэффициент. Результат округляется до целых минорных единиц. */
export function scale(value: Money, factor: number): Money {
  return money(Math.round(value.amount * factor), value.currency);
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new TypeError(
      `Нельзя складывать ${a.currency} и ${b.currency} без явной конвертации по курсу.`,
    );
  }
}

/**
 * Курс валют — ДАННЫЕ, а не константа в коде.
 * Хранится в базе строкой с датой и редактируется владельцем.
 */
export interface FxRate {
  base: CurrencyCode;
  quote: CurrencyCode;
  /** Сколько единиц base даёт одну единицу quote. Например 12500 UZS за 1 USD. */
  rate: number;
  effectiveOn: string;
}

export function convert(value: Money, to: CurrencyCode, rates: readonly FxRate[]): Money {
  if (value.currency === to) return value;

  const direct = rates.find((r) => r.base === value.currency && r.quote === to);
  if (direct) {
    return money(Math.round(value.amount / direct.rate), to);
  }

  const inverse = rates.find((r) => r.base === to && r.quote === value.currency);
  if (inverse) {
    return money(Math.round(value.amount * inverse.rate), to);
  }

  throw new Error(
    `Курс ${value.currency}→${to} не задан. Задай его в настройках — я его не выдумываю.`,
  );
}

/**
 * Узкий неразрывный пробел между разрядами: 4 820 000, а не 4,820,000.
 * Задан явно: Intl выдаёт разный разделитель в зависимости от версии ICU,
 * а вывод денег обязан быть одинаковым в браузере, на сервере и в тестах.
 */
export const GROUP_SEPARATOR = " ";

/** Настоящий минус U+2212, а не дефис: в колонке цифр это видно. */
export const MINUS_SIGN = "−";

/**
 * Форматирование.
 */
export function format(
  value: Money,
  options: { sign?: boolean; currency?: boolean } = {},
): string {
  const { sign = false, currency = true } = options;
  const major = toMajor(value);
  const abs = Math.abs(major);
  const spec = CURRENCIES[value.currency];
  const fractionDigits =
    value.amount % spec.minorUnits === 0 ? 0 : spec.displayFractionDigits;

  const digits = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
    .format(abs)
    // любой пробельный разделитель, который поставил Intl → наш
    .replace(/\s/g, GROUP_SEPARATOR);

  const prefix = value.amount < 0 ? MINUS_SIGN : sign ? "+" : "";
  const suffix = currency ? ` ${CURRENCIES[value.currency].symbol}` : "";

  return `${prefix}${digits}${suffix}`;
}

/**
 * Разбор суммы, набранной руками.
 *
 * Владелец вводит всё сам, и вводит по-человечески: «50 000», «50000»,
 * «1 250,50», «12.5». Всё это одна и та же сумма, и требовать канонической
 * формы значит превратить быстрый ввод в заполнение анкеты.
 *
 * Чего парсер НЕ делает: не угадывает валюту, не принимает выражения и не
 * трактует мусор как ноль. Пустая строка и «абв» дают null, а не 0 — тихий
 * ноль в деньгах опаснее отказа.
 */
export function parseAmount(input: string, currency: CurrencyCode): Money | null {
  // Пробелы любых сортов — разделители разрядов: обычный, неразрывный,
  // узкий неразрывный и апостроф, которым тоже разделяют.
  const cleaned = input
    .replace(/[\s   ']/g, "")
    .replace(",", ".")
    .trim();

  if (cleaned === "") return null;
  // Один знак минуса спереди, цифры, не более одной точки.
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;

  const units = CURRENCIES[currency].minorUnits;
  const negative = cleaned.startsWith("-");
  const [whole = "0", fraction = ""] = cleaned.replace("-", "").split(".");

  // Считаем по строке, а не через parseFloat: 0.1 + 0.2 в деньгах недопустимо.
  const scale = String(units).length - 1;
  const padded = (fraction + "0".repeat(scale)).slice(0, scale);
  const rest = fraction.slice(scale);

  let amount = Number(whole) * units + Number(padded || "0");
  // Первая отброшенная цифра решает округление: 12,345 → 12,35.
  if (rest.length > 0 && Number(rest[0]) >= 5) amount += 1;

  if (!Number.isSafeInteger(amount)) return null;
  return money(negative ? -amount : amount, currency);
}
