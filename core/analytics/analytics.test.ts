import { describe, expect, it } from "vitest";
import { calendarDate as d } from "@/core/date";
import { fromMajor, toMajor } from "@/core/money";
import { rootCategoryId } from "@/core/taxonomy";
import { breakdown, countBy, monthlyTotals, total, type CalendarItem, type Spend } from "./index";

const spends: Spend[] = [
  // еда с друзьями, удовольствие
  s("1", "2026-01-05", 120_000, "food.cafe", "friends", "joy"),
  s("2", "2026-01-12", 80_000, "food.cafe", "friends", "joy"),
  s("3", "2026-02-02", 200_000, "food.delivery", "alone", "impulse"),
  // продукты для семьи, необходимость
  s("4", "2026-01-07", 400_000, "food.groceries", "family", "need"),
  // такси один, необходимость
  s("5", "2026-01-09", 60_000, "transport.taxi", "alone", "need"),
  // приход
  { id: "6", occurredOn: d("2026-01-05"), amount: fromMajor(2_400_000, "UZS"), direction: "in" },
];

function s(
  id: string,
  date: string,
  amount: number,
  categoryId: string,
  contextId: string,
  motiveId: string,
): Spend {
  return {
    id,
    occurredOn: d(date),
    amount: fromMajor(amount, "UZS"),
    direction: "out",
    categoryId,
    contextId,
    motiveId,
  };
}

const january = { from: d("2026-01-01"), to: d("2026-01-31") };
const halfYear = { from: d("2026-01-01"), to: d("2026-06-30") };

describe("срез по категориям", () => {
  it("складывает по листьям и сортирует по убыванию", () => {
    const slices = breakdown(spends, { ...january, by: "category", currency: "UZS" });
    expect(slices[0]!.key).toBe("food.groceries");
    expect(toMajor(slices[0]!.total)).toBe(400_000);
  });

  it("сворачивает до корневой категории — вопрос «сколько на еду вообще»", () => {
    const slices = breakdown(spends, {
      ...january,
      by: "category",
      currency: "UZS",
      rollUp: rootCategoryId,
    });
    const food = slices.find((x) => x.key === "food")!;
    expect(toMajor(food.total)).toBe(120_000 + 80_000 + 400_000);
    expect(food.count).toBe(3);
  });

  it("считает долю от суммы, а не от количества", () => {
    const slices = breakdown(spends, {
      ...january,
      by: "category",
      currency: "UZS",
      rollUp: rootCategoryId,
    });
    const food = slices.find((x) => x.key === "food")!;
    // 600 000 из 660 000
    expect(food.share).toBeCloseTo(600_000 / 660_000, 5);
  });

  it("не смешивает приход с расходом", () => {
    const slices = breakdown(spends, { ...january, by: "category", currency: "UZS" });
    expect(slices.every((x) => x.key !== "—")).toBe(true);
  });
});

describe("срез по контексту — «с кем»", () => {
  it("отвечает на «сколько ушло с друзьями»", () => {
    const slices = breakdown(spends, { ...halfYear, by: "context", currency: "UZS" });
    const friends = slices.find((x) => x.key === "friends")!;
    expect(toMajor(friends.total)).toBe(200_000);
    expect(friends.count).toBe(2);
  });

  it("уважает границы периода", () => {
    const slices = breakdown(spends, { ...january, by: "context", currency: "UZS" });
    expect(slices.find((x) => x.key === "alone")!.count).toBe(1); // февральская доставка не входит
  });
});

describe("срез по поводу — самое неудобное измерение", () => {
  it("отвечает на «сколько я потратил импульсивно»", () => {
    const slices = breakdown(spends, { ...halfYear, by: "motive", currency: "UZS" });
    const impulse = slices.find((x) => x.key === "impulse")!;
    expect(toMajor(impulse.total)).toBe(200_000);
  });

  it("складывает неразмеченные траты в отдельную корзину, а не теряет их", () => {
    const unmarked: Spend = {
      id: "x",
      occurredOn: d("2026-01-15"),
      amount: fromMajor(50_000, "UZS"),
      direction: "out",
    };
    const slices = breakdown([...spends, unmarked], { ...january, by: "motive", currency: "UZS" });
    expect(slices.find((x) => x.key === "—")).toBeDefined();
  });
});

describe("счёт событий", () => {
  const events: CalendarItem[] = [
    { id: "a", occurredOn: d("2026-01-04"), categoryId: "ev.meeting", contextId: "friends" },
    { id: "b", occurredOn: d("2026-02-11"), categoryId: "ev.meeting", contextId: "friends" },
    { id: "c", occurredOn: d("2026-03-01"), categoryId: "ev.meeting", contextId: "family" },
    { id: "e", occurredOn: d("2026-08-01"), categoryId: "ev.meeting", contextId: "friends" },
  ];

  it("отвечает на «сколько встреч с друзьями за полгода»", () => {
    const slices = countBy(events, { ...halfYear, by: "context" });
    expect(slices.find((x) => x.key === "friends")!.count).toBe(2);
  });

  it("не считает то, что за границей периода", () => {
    const slices = countBy(events, { ...halfYear, by: "context" });
    expect(slices.reduce((sum, x) => sum + x.count, 0)).toBe(3);
  });
});

describe("помесячная динамика и итоги", () => {
  it("раскладывает по месяцам в хронологическом порядке", () => {
    const months = monthlyTotals(spends, { ...halfYear, currency: "UZS" });
    expect(months.map((m) => m.month)).toEqual(["2026-01", "2026-02"]);
    expect(toMajor(months[1]!.total)).toBe(200_000);
  });

  it("умеет фильтровать по конкретной категории", () => {
    const months = monthlyTotals(spends, {
      ...halfYear,
      currency: "UZS",
      categoryId: "food.cafe",
    });
    expect(toMajor(months[0]!.total)).toBe(200_000);
  });

  it("считает итог за период", () => {
    expect(toMajor(total(spends, { ...january, currency: "UZS" }))).toBe(660_000);
  });

  it("считает итог по приходу отдельно", () => {
    expect(toMajor(total(spends, { ...january, direction: "in", currency: "UZS" }))).toBe(2_400_000);
  });
});
