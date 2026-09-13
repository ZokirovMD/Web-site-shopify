import { describe, expect, it } from "vitest";
import { calendarDate as d } from "@/core/date";
import { fromMajor, toMajor, type FxRate } from "@/core/money";
import {
  balanceOn,
  burnRate,
  firstShortfall,
  fundedOn,
  project,
  safeToSpend,
  type Account,
  type MoneyRule,
  type Transaction,
} from "./index";

const rates: FxRate[] = [
  { base: "UZS", quote: "USD", rate: 12_500, effectiveOn: "2026-01-01" },
];

const cash: Account = {
  id: "cash",
  currency: "UZS",
  openingBalance: fromMajor(4_820_000, "UZS"),
};

function run(
  rules: MoneyRule[] = [],
  transactions: Transaction[] = [],
  to = d("2026-01-31"),
  accounts: Account[] = [cash],
) {
  return project({
    from: d("2026-01-01"),
    to,
    accounts,
    transactions,
    rules,
    rates,
    currency: "UZS",
  });
}

describe("базовый расчёт", () => {
  it("без правил и операций держит остаток ровным", () => {
    const series = run([], [], d("2026-01-05"));
    expect(series).toHaveLength(5);
    expect(toMajor(series[0]!.closing)).toBe(4_820_000);
    expect(toMajor(series[4]!.closing)).toBe(4_820_000);
  });

  it("учитывает ежедневный расход — сценарий «50 000 в день»", () => {
    const burn: MoneyRule = {
      id: "burn",
      cadence: "daily",
      interval: 1,
      anchorDate: d("2026-01-01"),
      accountId: "cash",
      amount: fromMajor(50_000, "UZS"),
      direction: "out",
    };

    const series = run([burn], [], d("2026-01-10"));
    // 10 дней по 50 000 = 500 000
    expect(toMajor(series[9]!.closing)).toBe(4_820_000 - 500_000);
  });

  it("складывает приход и расход — сценарий «стипендия 5-го»", () => {
    const rules: MoneyRule[] = [
      {
        id: "burn",
        cadence: "daily",
        interval: 1,
        anchorDate: d("2026-01-01"),
        accountId: "cash",
        amount: fromMajor(50_000, "UZS"),
        direction: "out",
      },
      {
        id: "stipend",
        cadence: "monthly",
        interval: 1,
        anchorDate: d("2026-01-05"),
        accountId: "cash",
        amount: fromMajor(2_400_000, "UZS"),
        direction: "in",
      },
    ];

    const series = run(rules, [], d("2026-01-31"));
    // 31 день × 50 000 = 1 550 000 расход, один приход 2 400 000
    expect(toMajor(series[30]!.closing)).toBe(4_820_000 - 1_550_000 + 2_400_000);
    expect(toMajor(series[4]!.inflow)).toBe(2_400_000);
  });
});

describe("факт против правил", () => {
  it("учитывает настоящие операции внутри окна", () => {
    const tx: Transaction = {
      id: "t1",
      accountId: "cash",
      occurredOn: d("2026-01-03"),
      amount: fromMajor(300_000, "UZS"),
      direction: "out",
    };
    const series = run([], [tx], d("2026-01-05"));
    expect(toMajor(series[4]!.closing)).toBe(4_820_000 - 300_000);
  });

  it("сворачивает операции до начала окна в стартовый остаток", () => {
    const tx: Transaction = {
      id: "t0",
      accountId: "cash",
      occurredOn: d("2025-12-20"),
      amount: fromMajor(1_000_000, "UZS"),
      direction: "in",
    };
    const series = run([], [tx], d("2026-01-02"));
    expect(toMajor(series[0]!.closing)).toBe(4_820_000 + 1_000_000);
  });

  it("не считает замещённую версию операции — правка не затирает историю", () => {
    const txs: Transaction[] = [
      {
        id: "old",
        accountId: "cash",
        occurredOn: d("2026-01-03"),
        amount: fromMajor(300_000, "UZS"),
        direction: "out",
        supersededBy: "new",
      },
      {
        id: "new",
        accountId: "cash",
        occurredOn: d("2026-01-03"),
        amount: fromMajor(450_000, "UZS"),
        direction: "out",
      },
    ];
    const series = run([], txs, d("2026-01-05"));
    expect(toMajor(series[4]!.closing)).toBe(4_820_000 - 450_000);
  });

  it("не удваивает правило, уже материализованное в операцию", () => {
    const burn: MoneyRule = {
      id: "burn",
      cadence: "daily",
      interval: 1,
      anchorDate: d("2026-01-01"),
      accountId: "cash",
      amount: fromMajor(50_000, "UZS"),
      direction: "out",
    };
    // 2 января правило уже записано настоящей строкой, но на 60 000 — реальность отличалась
    const materialized: Transaction = {
      id: "m1",
      accountId: "cash",
      occurredOn: d("2026-01-02"),
      amount: fromMajor(60_000, "UZS"),
      direction: "out",
      ruleId: "burn",
    };

    const series = run([burn], [materialized], d("2026-01-03"));
    // 1-е и 3-е по правилу (50 000), 2-е по факту (60 000)
    expect(toMajor(series[2]!.closing)).toBe(4_820_000 - 50_000 - 60_000 - 50_000);
  });

  it("игнорирует операции архивных счетов", () => {
    const archived: Account = { ...cash, id: "old", archived: true };
    const tx: Transaction = {
      id: "t",
      accountId: "old",
      occurredOn: d("2026-01-02"),
      amount: fromMajor(999_000, "UZS"),
      direction: "out",
    };
    const series = run([], [tx], d("2026-01-03"), [cash, archived]);
    expect(toMajor(series[2]!.closing)).toBe(4_820_000);
  });
});

describe("мультивалютность", () => {
  it("приводит долларовый счёт к валюте расчёта по курсу из данных", () => {
    const usd: Account = {
      id: "usd",
      currency: "USD",
      openingBalance: fromMajor(100, "USD"),
    };
    const series = run([], [], d("2026-01-01"), [cash, usd]);
    expect(toMajor(series[0]!.closing)).toBe(4_820_000 + 1_250_000);
  });

  it("падает, если курса нет — а не выдумывает его", () => {
    const usd: Account = {
      id: "usd",
      currency: "USD",
      openingBalance: fromMajor(100, "USD"),
    };
    expect(() =>
      project({
        from: d("2026-01-01"),
        to: d("2026-01-01"),
        accounts: [usd],
        transactions: [],
        rules: [],
        rates: [],
        currency: "UZS",
      }),
    ).toThrow(/не задан/);
  });
});

describe("производные ответы", () => {
  const burn: MoneyRule = {
    id: "burn",
    cadence: "daily",
    interval: 1,
    anchorDate: d("2026-01-01"),
    accountId: "cash",
    amount: fromMajor(50_000, "UZS"),
    direction: "out",
  };

  it("balanceOn отвечает на «сколько будет в этот день»", () => {
    const series = run([burn], [], d("2026-01-10"));
    expect(toMajor(balanceOn(series, d("2026-01-05"))!)).toBe(4_820_000 - 250_000);
  });

  it("balanceOn возвращает null вне горизонта", () => {
    const series = run([burn], [], d("2026-01-10"));
    expect(balanceOn(series, d("2026-02-01"))).toBeNull();
  });

  it("burnRate считает средний расход в день", () => {
    const series = run([burn], [], d("2026-01-10"));
    expect(toMajor(burnRate(series, "UZS"))).toBe(50_000);
  });

  it("fundedOn отвечает «когда соберу» с учётом подушки", () => {
    const income: MoneyRule = {
      id: "in",
      cadence: "daily",
      interval: 1,
      anchorDate: d("2026-01-01"),
      accountId: "cash",
      amount: fromMajor(100_000, "UZS"),
      direction: "in",
    };
    const series = run([income], [], d("2026-01-31"));
    // нужно 5 000 000 + подушка 500 000 сверху текущих 4 820 000 → +680 000 → 7-й день
    const when = fundedOn(series, fromMajor(5_000_000, "UZS"), fromMajor(500_000, "UZS"));
    expect(when).toBe("2026-01-07");
  });

  it("fundedOn честно возвращает null, если на горизонте не соберётся", () => {
    const series = run([burn], [], d("2026-01-31"));
    expect(fundedOn(series, fromMajor(99_000_000, "UZS"), fromMajor(0, "UZS"))).toBeNull();
  });

  it("safeToSpend считает по худшему дню, а не по сегодняшнему", () => {
    // расход идёт каждый день, худший день — последний
    const series = run([burn], [], d("2026-01-31"));
    const safe = safeToSpend(series, fromMajor(1_000_000, "UZS"), "UZS");
    expect(toMajor(safe)).toBe(4_820_000 - 1_550_000 - 1_000_000);
  });

  it("safeToSpend не уходит в минус", () => {
    const series = run([burn], [], d("2026-01-31"));
    expect(toMajor(safeToSpend(series, fromMajor(99_000_000, "UZS"), "UZS"))).toBe(0);
  });

  it("firstShortfall находит день, когда деньги кончатся", () => {
    const heavy: MoneyRule = { ...burn, amount: fromMajor(1_000_000, "UZS") };
    const series = run([heavy], [], d("2026-01-31"));
    // 4 820 000 / 1 000 000 → на 5-й день остаток уходит в минус
    expect(firstShortfall(series)).toBe("2026-01-05");
  });

  it("firstShortfall возвращает null, когда всё в порядке", () => {
    const series = run([burn], [], d("2026-01-10"));
    expect(firstShortfall(series)).toBeNull();
  });
});
