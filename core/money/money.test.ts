import { describe, expect, it } from "vitest";
import {
  GROUP_SEPARATOR as S,
  MINUS_SIGN as M,
  add,
  compare,
  convert,
  format,
  fromMajor,
  isNegative,
  minor,
  money,
  negate,
  scale,
  subtract,
  toMajor,
  type FxRate,
} from "./index";

describe("минорные единицы", () => {
  it("отказывается принимать дробные значения", () => {
    expect(() => minor(10.5)).toThrow(RangeError);
  });

  it("переводит из привычных единиц и обратно без потерь", () => {
    const m = fromMajor(50_000, "UZS");
    expect(m.amount).toBe(5_000_000);
    expect(toMajor(m)).toBe(50_000);
  });

  it("округляет дробные привычные единицы до целых минорных", () => {
    expect(fromMajor(4.005, "USD").amount).toBe(401);
  });
});

describe("арифметика", () => {
  it("складывает и вычитает", () => {
    const a = fromMajor(50_000, "UZS");
    const b = fromMajor(20_000, "UZS");
    expect(toMajor(add(a, b))).toBe(70_000);
    expect(toMajor(subtract(a, b))).toBe(30_000);
  });

  it("не даёт сложить разные валюты без конвертации", () => {
    expect(() => add(fromMajor(1, "USD"), fromMajor(1, "UZS"))).toThrow(TypeError);
  });

  it("отрицает и распознаёт знак", () => {
    const out = negate(fromMajor(50_000, "UZS"));
    expect(isNegative(out)).toBe(true);
    expect(toMajor(out)).toBe(-50_000);
  });

  it("масштабирует с округлением до целых минорных", () => {
    expect(scale(money(101, "USD"), 0.5).amount).toBe(51);
  });

  it("сравнивает", () => {
    expect(compare(fromMajor(2, "USD"), fromMajor(1, "USD"))).toBeGreaterThan(0);
  });
});

describe("конвертация", () => {
  const rates: FxRate[] = [
    { base: "UZS", quote: "USD", rate: 12_500, effectiveOn: "2026-09-13" },
  ];

  it("переводит сумы в доллары", () => {
    const uzs = fromMajor(125_000, "UZS");
    expect(toMajor(convert(uzs, "USD", rates))).toBe(10);
  });

  it("переводит доллары в сумы по тому же курсу", () => {
    const usd = fromMajor(4, "USD");
    expect(toMajor(convert(usd, "UZS", rates))).toBe(50_000);
  });

  it("возвращает исходное значение, если валюта совпадает", () => {
    const uzs = fromMajor(1, "UZS");
    expect(convert(uzs, "UZS", rates)).toBe(uzs);
  });

  it("падает с понятной ошибкой, если курса нет — а не выдумывает его", () => {
    expect(() => convert(fromMajor(1, "USD"), "UZS", [])).toThrow(/не задан/);
  });
});

describe("форматирование", () => {
  it("разделяет группы и не показывает копейки у круглых сумм", () => {
    expect(format(fromMajor(4_820_000, "UZS"))).toBe(`4${S}820${S}000 сум`);
  });

  it("показывает копейки, когда они есть", () => {
    expect(format(fromMajor(4.5, "USD"))).toBe("4,50 $");
  });

  it("ставит настоящий минус, а не дефис", () => {
    expect(format(fromMajor(-1_350_000, "UZS"))).toBe(`${M}1${S}350${S}000 сум`);
  });

  it("ставит плюс только по запросу", () => {
    expect(format(fromMajor(2_400_000, "UZS"), { sign: true })).toBe(`+2${S}400${S}000 сум`);
  });

  it("умеет без валюты", () => {
    expect(format(fromMajor(50_000, "UZS"), { currency: false })).toBe(`50${S}000`);
  });
});
