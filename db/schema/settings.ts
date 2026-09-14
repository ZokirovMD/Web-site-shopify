/**
 * ORBIT — настройки пользователя.
 * Валюта, курс, локаль, подушка. Всё, что нельзя зашивать в код.
 */

import { pgTable, smallint, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { auditColumns, currencyEnum, moneyColumn } from "./shared";

export const settings = pgTable("settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  locale: varchar("locale", { length: 8 }).notNull().default("ru"),
  primaryCurrency: currencyEnum("primary_currency").notNull().default("UZS"),
  displayCurrency: currencyEnum("display_currency").notNull().default("UZS"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Tashkent"),
  /** 1 — понедельник. */
  weekStart: smallint("week_start").notNull().default(1),
  theme: varchar("theme", { length: 16 }).notNull().default("system"),
  /** Неприкосновенный остаток: ниже него safeToSpend не опускается. */
  cashBufferMinor: moneyColumn("cash_buffer_minor"),
  ...auditColumns,
});
