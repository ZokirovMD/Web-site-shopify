import { describe, expect, it } from "vitest";
import { calendarDate as d } from "@/core/date";
import { fromMajor, toMajor } from "@/core/money";
import type { Spend } from "@/core/analytics";
import { budgetStatus, monthBounds, type Budget } from "./index";

const january = monthBounds(d("2026-01-15"));

function spend(id: string, date: string, amount: number, categoryId?: string): Spend {
  return {
    id,
    occurredOn: d(date),
    amount: fromMajor(amount, "UZS"),
    direction: "out",
    categoryId: categoryId ?? null,
  };
}

const overall: Budget = {
  id: "b1",
  limit: fromMajor(3_000_000, "UZS"),
  period: "month",
};

describe("границы месяца", () => {
  it("находит первое и последнее число", () => {
    expect(january.from).toBe("2026-01-01");
    expect(january.to).toBe("2026-01-31");
  });

  it("знает, что в феврале 28 дней", () => {
    expect(monthBounds(d("2026-02-10")).to).toBe("2026-02-28");
  });
});

describe("состояние бюджета", () => {
  it("считает потраченное и остаток", () => {
    const spends = [spend("1", "2026-01-05", 500_000), spend("2", "2026-01-10", 300_000)];
    const status = budgetStatus(overall, spends, {
      ...january,
      asOf: d("2026-01-10"),
      currency: "UZS",
    });
    expect(toMajor(status.spent)).toBe(800_000);
    expect(toMajor(status.remaining)).toBe(2_200_000);
  });

  it("не учитывает траты позже даты расчёта", () => {
    const spends = [spend("1", "2026-01-05", 500_000), spend("2", "2026-01-20", 900_000)];
    const status = budgetStatus(overall, spends, {
      ...january,
      asOf: d("2026-01-10"),
      currency: "UZS",
    });
    expect(toMajor(status.spent)).toBe(500_000);
  });

  it("считает темп от начала периода, а не за всё окно", () => {
    // 1 000 000 за 10 дней = 100 000 в день
    const spends = [spend("1", "2026-01-05", 1_000_000)];
    const status = budgetStatus(overall, spends, {
      ...january,
      asOf: d("2026-01-10"),
      currency: "UZS",
    });
    expect(toMajor(status.pace)).toBe(100_000);
  });

  it("говорит, сколько можно тратить в день до конца месяца", () => {
    const spends = [spend("1", "2026-01-05", 1_000_000)];
    const status = budgetStatus(overall, spends, {
      ...january,
      asOf: d("2026-01-10"),
      currency: "UZS",
    });
    // остаток 2 000 000 на 21 оставшийся день
    expect(toMajor(status.allowancePerDay)).toBeCloseTo(2_000_000 / 21, 0);
  });
});

describe("предупреждение о выходе за лимит", () => {
  it("называет дату, когда лимит кончится при текущем темпе", () => {
    // 2 000 000 за 10 дней = 200 000 в день, остаток 1 000 000 → ещё 5 дней
    const spends = [spend("1", "2026-01-05", 2_000_000)];
    const status = budgetStatus(overall, spends, {
      ...january,
      asOf: d("2026-01-10"),
      currency: "UZS",
    });
    expect(status.overrunOn).toBe("2026-01-16");
    expect(status.health).toBe("tight");
  });

  it("молчит, когда темп укладывается в месяц", () => {
    const spends = [spend("1", "2026-01-05", 300_000)];
    const status = budgetStatus(overall, spends, {
      ...january,
      asOf: d("2026-01-10"),
      currency: "UZS",
    });
    expect(status.overrunOn).toBeNull();
    expect(status.health).toBe("ok");
  });

  it("помечает превышение сегодняшним числом, когда оно уже случилось", () => {
    const spends = [spend("1", "2026-01-05", 3_500_000)];
    const status = budgetStatus(overall, spends, {
      ...january,
      asOf: d("2026-01-10"),
      currency: "UZS",
    });
    expect(status.health).toBe("over");
    expect(status.overrunOn).toBe("2026-01-10");
    expect(toMajor(status.remaining)).toBe(-500_000);
  });

  it("не даёт отрицательный дневной лимит", () => {
    const spends = [spend("1", "2026-01-05", 3_500_000)];
    const status = budgetStatus(overall, spends, {
      ...january,
      asOf: d("2026-01-10"),
      currency: "UZS",
    });
    expect(toMajor(status.allowancePerDay)).toBe(0);
  });
});

describe("бюджет на категорию", () => {
  const food: Budget = {
    id: "b2",
    categoryId: "food",
    limit: fromMajor(1_000_000, "UZS"),
    period: "month",
  };

  it("покрывает вложенные категории — лимит на «еду» ловит «кафе»", () => {
    const spends = [
      spend("1", "2026-01-05", 300_000, "food.cafe"),
      spend("2", "2026-01-06", 200_000, "food.groceries"),
      spend("3", "2026-01-07", 900_000, "transport.taxi"),
    ];
    const status = budgetStatus(food, spends, {
      ...january,
      asOf: d("2026-01-10"),
      currency: "UZS",
    });
    expect(toMajor(status.spent)).toBe(500_000);
  });

  it("не считает траты без категории в категорийный лимит", () => {
    const spends = [spend("1", "2026-01-05", 300_000)];
    const status = budgetStatus(food, spends, {
      ...january,
      asOf: d("2026-01-10"),
      currency: "UZS",
    });
    expect(toMajor(status.spent)).toBe(0);
  });
});
