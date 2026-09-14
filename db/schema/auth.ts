/**
 * ORBIT — пользователи и сессии.
 *
 * Схема multi-tenant с первого дня: `user_id` есть везде. Это не план продукта,
 * а дешёвая страховка — владелец решил, что система личная, но если однажды
 * даст доступ друзьям, переделывать не придётся.
 */

import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  /** argon2id. Никогда не логируется и не уходит на клиент. */
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Хеш токена, а не сам токен: утечка таблицы не даёт войти. */
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

/** Ограничение попыток входа. Живёт в базе, а не в памяти процесса:
 *  на serverless память не переживает вызов. */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
    succeeded: varchar("succeeded", { length: 5 }).notNull().default("false"),
  },
  (table) => [index("login_attempts_email_idx").on(table.email, table.attemptedAt)],
);
