import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  addYears,
  calendarDate,
  compareDates,
  dayOfMonth,
  daysBetween,
  eachDay,
  isAfter,
  isBefore,
  lastDayOfMonth,
  todayIn,
  weekday,
} from "./index";

const d = calendarDate;

describe("разбор даты", () => {
  it("принимает только YYYY-MM-DD", () => {
    expect(d("2026-09-14")).toBe("2026-09-14");
    expect(() => d("14.09.2026")).toThrow(RangeError);
    expect(() => d("2026-9-14")).toThrow(RangeError);
  });
});

describe("арифметика дней", () => {
  it("переходит через границу месяца", () => {
    expect(addDays(d("2026-01-31"), 1)).toBe("2026-02-01");
  });

  it("переходит через границу года", () => {
    expect(addDays(d("2026-12-31"), 1)).toBe("2027-01-01");
  });

  it("считает назад", () => {
    expect(addDays(d("2026-03-01"), -1)).toBe("2026-02-28");
  });

  it("знает про високосный год", () => {
    expect(addDays(d("2028-02-28"), 1)).toBe("2028-02-29");
  });

  it("расстояние между датами — целое число суток", () => {
    expect(daysBetween(d("2026-09-01"), d("2026-10-01"))).toBe(30);
    expect(daysBetween(d("2026-10-01"), d("2026-09-01"))).toBe(-30);
  });
});

describe("арифметика месяцев", () => {
  it("зажимает день, а не переполняет месяц", () => {
    // Правило «плачу 31-го» после февраля не должно навсегда съехать на март.
    expect(addMonths(d("2026-01-31"), 1)).toBe("2026-02-28");
    expect(addMonths(d("2028-01-31"), 1)).toBe("2028-02-29");
  });

  it("не теряет день там, где его хватает", () => {
    expect(addMonths(d("2026-01-15"), 1)).toBe("2026-02-15");
  });

  it("считает назад через год", () => {
    expect(addMonths(d("2026-01-15"), -1)).toBe("2025-12-15");
  });

  it("год — это двенадцать месяцев с тем же зажимом", () => {
    expect(addYears(d("2028-02-29"), 1)).toBe("2029-02-28");
  });

  it("знает длину месяца", () => {
    expect(lastDayOfMonth(2026, 1)).toBe(28);
    expect(lastDayOfMonth(2028, 1)).toBe(29);
    expect(lastDayOfMonth(2026, 3)).toBe(30);
  });
});

describe("сравнение и перечисление", () => {
  it("сравнивает по календарю", () => {
    expect(isBefore(d("2026-09-01"), d("2026-09-02"))).toBe(true);
    expect(isAfter(d("2026-09-02"), d("2026-09-01"))).toBe(true);
    expect(compareDates(d("2026-09-01"), d("2026-09-01"))).toBe(0);
  });

  it("день недели считается без сдвига пояса", () => {
    // 14 сентября 2026 — понедельник.
    expect(weekday(d("2026-09-14"))).toBe(1);
    expect(dayOfMonth(d("2026-09-14"))).toBe(14);
  });

  it("перечисляет дни включительно", () => {
    expect(eachDay(d("2026-09-13"), d("2026-09-15"))).toEqual([
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
    ]);
  });

  it("пустой отрезок, если конец раньше начала", () => {
    expect(eachDay(d("2026-09-15"), d("2026-09-13"))).toEqual([]);
  });
});

describe("сегодня в заданном поясе", () => {
  it("в Ташкенте ночью уже завтра, хотя по UTC ещё вчера", () => {
    // 21:30 UTC = 02:30 следующего дня в Ташкенте (UTC+5).
    const moment = new Date("2026-09-13T21:30:00Z");
    expect(todayIn("Asia/Tashkent", moment)).toBe("2026-09-14");
    expect(todayIn("UTC", moment)).toBe("2026-09-13");
  });

  it("в Ташкенте ранним утром ещё тот же день, что и по UTC", () => {
    const moment = new Date("2026-09-14T06:00:00Z");
    expect(todayIn("Asia/Tashkent", moment)).toBe("2026-09-14");
    expect(todayIn("UTC", moment)).toBe("2026-09-14");
  });

  it("западнее Гринвича день, наоборот, отстаёт", () => {
    const moment = new Date("2026-09-14T03:00:00Z");
    expect(todayIn("America/New_York", moment)).toBe("2026-09-13");
  });

  it("отдаёт дату в том же формате, что и остальной модуль", () => {
    const value = todayIn("Asia/Tashkent", new Date("2026-01-05T10:00:00Z"));
    expect(value).toBe("2026-01-05");
    expect(() => calendarDate(value)).not.toThrow();
  });
});
