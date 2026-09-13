import { describe, expect, it } from "vitest";
import { calendarDate as d } from "@/core/date";
import { occurrences, type RecurringRule } from "./index";

function rule(partial: Partial<RecurringRule>): RecurringRule {
  return {
    id: "test",
    cadence: "daily",
    interval: 1,
    anchorDate: d("2026-01-01"),
    ...partial,
  };
}

describe("ежедневные правила", () => {
  it("срабатывают каждый день — это сценарий «50 000 в день»", () => {
    const dates = occurrences(rule({}), d("2026-01-01"), d("2026-01-05"));
    expect(dates).toEqual(["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"]);
  });

  it("уважают интервал через день", () => {
    const dates = occurrences(rule({ interval: 2 }), d("2026-01-01"), d("2026-01-07"));
    expect(dates).toEqual(["2026-01-01", "2026-01-03", "2026-01-05", "2026-01-07"]);
  });

  it("не срабатывают до якоря", () => {
    const dates = occurrences(
      rule({ anchorDate: d("2026-01-10") }),
      d("2026-01-01"),
      d("2026-01-12"),
    );
    expect(dates).toEqual(["2026-01-10", "2026-01-11", "2026-01-12"]);
  });

  it("отдают только окно, даже если правило началось раньше", () => {
    const dates = occurrences(rule({}), d("2026-03-01"), d("2026-03-03"));
    expect(dates).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
  });

  it("молчат, когда выключены", () => {
    expect(occurrences(rule({ active: false }), d("2026-01-01"), d("2026-01-05"))).toEqual([]);
  });

  it("отказываются работать с нецелым интервалом", () => {
    expect(() => occurrences(rule({ interval: 0 }), d("2026-01-01"), d("2026-01-05"))).toThrow(
      RangeError,
    );
  });
});

describe("границы действия", () => {
  it("прекращаются в дату окончания включительно", () => {
    const dates = occurrences(
      rule({ endsOn: d("2026-01-03") }),
      d("2026-01-01"),
      d("2026-01-10"),
    );
    expect(dates).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });

  it("прекращаются после N срабатываний", () => {
    const dates = occurrences(rule({ endsAfterN: 3 }), d("2026-01-01"), d("2026-01-10"));
    expect(dates).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });

  it("считают N от якоря, а не от начала окна", () => {
    // правило началось 1-го и уже отработало трижды к 4-му
    const dates = occurrences(rule({ endsAfterN: 3 }), d("2026-01-04"), d("2026-01-10"));
    expect(dates).toEqual([]);
  });
});

describe("недельные правила", () => {
  it("срабатывают в указанные дни недели", () => {
    // 2026-01-01 — четверг. Просим понедельник(1) и среду(3).
    const dates = occurrences(
      rule({ cadence: "weekly", weekdayMask: [1, 3] }),
      d("2026-01-01"),
      d("2026-01-15"),
    );
    expect(dates).toEqual([
      "2026-01-05",
      "2026-01-07",
      "2026-01-12",
      "2026-01-14",
    ]);
  });

  it("без маски берут день недели якоря", () => {
    const dates = occurrences(
      rule({ cadence: "weekly", anchorDate: d("2026-01-01") }),
      d("2026-01-01"),
      d("2026-01-22"),
    );
    expect(dates).toEqual(["2026-01-01", "2026-01-08", "2026-01-15", "2026-01-22"]);
  });

  it("уважают интервал через неделю — это сценарий «зал через неделю»", () => {
    const dates = occurrences(
      rule({ cadence: "weekly", interval: 2, anchorDate: d("2026-01-01") }),
      d("2026-01-01"),
      d("2026-02-01"),
    );
    expect(dates).toEqual(["2026-01-01", "2026-01-15", "2026-01-29"]);
  });
});

describe("месячные правила", () => {
  it("срабатывают одного числа — это сценарий «стипендия 5-го»", () => {
    const dates = occurrences(
      rule({ cadence: "monthly", anchorDate: d("2026-01-05") }),
      d("2026-01-01"),
      d("2026-04-30"),
    );
    expect(dates).toEqual(["2026-01-05", "2026-02-05", "2026-03-05", "2026-04-05"]);
  });

  it("зажимают 31-е до конца короткого месяца, а не переносят на март", () => {
    const dates = occurrences(
      rule({ cadence: "monthly", anchorDate: d("2026-01-31") }),
      d("2026-01-01"),
      d("2026-04-30"),
    );
    expect(dates).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
  });

  it("возвращаются к 31-му после зажима — якорь помнит настоящее число", () => {
    const dates = occurrences(
      rule({ cadence: "monthly", anchorDate: d("2026-01-31") }),
      d("2026-03-01"),
      d("2026-03-31"),
    );
    expect(dates).toEqual(["2026-03-31"]);
  });

  it("уважают интервал раз в два месяца", () => {
    const dates = occurrences(
      rule({ cadence: "monthly", interval: 2, anchorDate: d("2026-01-10") }),
      d("2026-01-01"),
      d("2026-06-30"),
    );
    expect(dates).toEqual(["2026-01-10", "2026-03-10", "2026-05-10"]);
  });
});

describe("годовые правила", () => {
  it("срабатывают раз в год", () => {
    const dates = occurrences(
      rule({ cadence: "yearly", anchorDate: d("2026-03-15") }),
      d("2026-01-01"),
      d("2029-01-01"),
    );
    expect(dates).toEqual(["2026-03-15", "2027-03-15", "2028-03-15"]);
  });

  it("зажимают 29 февраля в невисокосный год", () => {
    const dates = occurrences(
      rule({ cadence: "yearly", anchorDate: d("2028-02-29") }),
      d("2028-01-01"),
      d("2029-12-31"),
    );
    expect(dates).toEqual(["2028-02-29", "2029-02-28"]);
  });
});
