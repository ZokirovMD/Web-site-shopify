/**
 * ORBIT — общие столбцы и типы схемы.
 *
 * Два поля есть в КАЖДОЙ таблице системы (docs/AGENT-LOOP.md §8):
 *   source      — кто создал запись: владелец, я, правило или импорт
 *   source_run  — в каком запуске агента, если это я
 *
 * Благодаря им владелец всегда отличает своё от моего и может откатить любое
 * моё действие. Без этого автоматические записи становятся неотличимы от ручных,
 * и доверие к системе заканчивается на первой неожиданной строке.
 */

import { bigint, pgEnum, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const sourceEnum = pgEnum("source", ["manual", "claude", "rule", "import"]);
export const currencyEnum = pgEnum("currency", ["UZS", "USD"]);
export const directionEnum = pgEnum("direction", ["in", "out"]);

/**
 * Деньги в минорных единицах — ОБЯЗАТЕЛЬНО bigint, не integer.
 *
 * 100 000 000 сум = 10 000 000 000 минорных единиц, а int4 держит
 * до 2 147 483 647. На суммах владельца переполнение случилось бы молча:
 * Postgres не предупреждает, он просто отказывается писать или рвёт значение.
 *
 * mode "number" безопасен до 2^53 — это 90 миллиардов сум, с запасом.
 */
export const moneyColumn = (name: string) =>
  bigint(name, { mode: "number" }).notNull().default(0);

export const auditColumns = {
  source: sourceEnum("source").notNull().default("manual"),
  sourceRun: uuid("source_run"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** Ключ сортировки для ручного порядка — дробный, чтобы вставка между
 *  соседями не переписывала весь список. */
export const orderKey = varchar("order_key", { length: 64 });
