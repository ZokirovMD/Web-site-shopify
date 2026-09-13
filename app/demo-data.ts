/**
 * ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ.
 *
 * Настоящих счетов, операций и правил владельца в системе ещё нет, и выдумывать
 * их как факт нельзя (PRODUCT.md → Evidence on Hand). Эти числа авторские,
 * помечены в интерфейсе синтетическими и уйдут целиком, как только появится база.
 *
 * Формат намеренно совпадает с боевым: те же типы, тот же движок. Замена демо
 * на реальные данные будет заменой одного импорта, а не переписыванием экрана.
 */

import { calendarDate, today } from "@/core/date";
import { fromMajor, type FxRate } from "@/core/money";
import type { Account, MoneyRule } from "@/core/projection";

export const DEMO_RATES: FxRate[] = [
  { base: "UZS", quote: "USD", rate: 12_500, effectiveOn: "2026-01-01" },
];

export const DEMO_ACCOUNTS: Account[] = [
  { id: "cash", currency: "UZS", openingBalance: fromMajor(3_620_000, "UZS") },
  { id: "card", currency: "UZS", openingBalance: fromMajor(1_200_000, "UZS") },
];

export function demoRules(from = today()): MoneyRule[] {
  const anchor = calendarDate(from);
  const [year, month] = anchor.split("-") as [string, string];
  const fifth = calendarDate(`${year}-${month}-05`);

  return [
    {
      id: "daily-burn",
      cadence: "daily",
      interval: 1,
      anchorDate: anchor,
      accountId: "cash",
      amount: fromMajor(50_000, "UZS"),
      direction: "out",
    },
    {
      id: "stipend",
      cadence: "monthly",
      interval: 1,
      anchorDate: fifth,
      accountId: "card",
      amount: fromMajor(2_400_000, "UZS"),
      direction: "in",
    },
    {
      id: "course",
      cadence: "monthly",
      interval: 1,
      anchorDate: calendarDate(`${year}-${month}-20`),
      accountId: "card",
      amount: fromMajor(500_000, "UZS"),
      direction: "out",
    },
  ];
}

export const DEMO_GOAL = {
  title: "Ноутбук",
  target: fromMajor(14_000_000, "UZS"),
  saved: fromMajor(5_600_000, "UZS"),
};

export const DEMO_BUFFER = fromMajor(500_000, "UZS");

export const DEMO_OBLIGATIONS = [
  { title: "Матанализ — домашка", when: "3 дня", urgency: "attention" as const },
  { title: "Отчёт по практике", when: "9 дней", urgency: "normal" as const },
  { title: "Оплата курса", when: "14 дней", urgency: "normal" as const },
];

export const DEMO_HABITS = [
  { title: "Зал", done: true, streak: 12 },
  { title: "Чтение", done: true, streak: 31 },
  { title: "Английский", done: false, streak: 4 },
];
