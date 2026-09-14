/**
 * ORBIT — контур агента (docs/AGENT-LOOP.md).
 *
 * Диалог живёт ВНУТРИ ORBIT: владелец пишет здесь, а не в отдельном чате.
 * Технически это асинхронная очередь — сообщение ждёт, пока я приду
 * по расписанию или через MCP.
 */

import {
  boolean,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { auditColumns, moneyColumn, currencyEnum } from "./shared";

export const threadStatusEnum = pgEnum("thread_status", [
  "open",
  "waiting",
  "answered",
  "closed",
]);

export const threads = pgTable(
  "threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 300 }),
    /** Из какого модуля спросили — вопрос приходит с контекстом. */
    moduleRef: varchar("module_ref", { length: 64 }),
    moduleId: uuid("module_id"),
    status: threadStatusEnum("status").notNull().default("open"),
    ...auditColumns,
  },
  (table) => [index("threads_user_idx").on(table.userId, table.status, table.updatedAt)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    author: varchar("author", { length: 16 }).notNull(),
    bodyMd: text("body_md").notNull(),
    /** Что именно было изменено этим сообщением — из этого строится откат. */
    actedJson: jsonb("acted_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("messages_thread_idx").on(table.threadId, table.createdAt)],
);

export const suggestionStatusEnum = pgEnum("suggestion_status", [
  "new",
  "accepted",
  "rejected",
  "snoozed",
]);

export const suggestions = pgTable(
  "suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 40 }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    bodyMd: text("body_md"),
    /**
     * Обязательное поле. Предложение без объяснения «почему именно тебе
     * и именно сейчас» не показывается: совет без причины — это шум.
     */
    rationale: text("rationale").notNull(),
    sourceUrl: text("source_url"),
    estHours: real("est_hours"),
    costMinor: moneyColumn("cost_minor"),
    currency: currencyEnum("currency").notNull().default("UZS"),
    status: suggestionStatusEnum("status").notNull().default("new"),
    snoozeUntil: date("snooze_until"),
    /** Причина отказа кормит профиль интересов: похожее больше не предлагается. */
    rejectedReason: varchar("rejected_reason", { length: 240 }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    materializedRef: varchar("materialized_ref", { length: 64 }),
    materializedId: uuid("materialized_id"),
    runId: uuid("run_id"),
    ...auditColumns,
  },
  (table) => [index("suggestions_user_idx").on(table.userId, table.status, table.createdAt)],
);

export const stanceEnum = pgEnum("stance", ["love", "like", "neutral", "dislike", "never"]);

export const interests = pgTable(
  "interests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topic: varchar("topic", { length: 160 }).notNull(),
    stance: stanceEnum("stance").notNull().default("neutral"),
    /**
     * «Футбол не интересен, НО приезд мировых звёзд — интересен».
     * Без исключений профиль бесполезен: интересы почти всегда с оговоркой.
     */
    exceptionNote: varchar("exception_note", { length: 300 }),
    weight: real("weight").notNull().default(1),
    ...auditColumns,
  },
  (table) => [index("interests_user_idx").on(table.userId)],
);

export const radarItems = pgTable(
  "radar_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 40 }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    body: text("body"),
    url: text("url"),
    /** Откуда находка. Имя поля не `source` — его занимает аудит-колонка
     *  из shared.ts, и спред молча затёр бы его. */
    sourceName: varchar("source_name", { length: 160 }),
    city: varchar("city", { length: 120 }),
    happensOn: date("happens_on"),
    interestScore: real("interest_score"),
    status: varchar("status", { length: 24 }).notNull().default("new"),
    ...auditColumns,
  },
  (table) => [index("radar_user_idx").on(table.userId, table.status, table.happensOn)],
);

/**
 * Журнал того, что я сделал сам. Ни одно моё действие не должно быть
 * сюрпризом, который нельзя отменить.
 */
export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 40 }).notNull(),
    trigger: varchar("trigger", { length: 24 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    summary: text("summary"),
    wroteJson: jsonb("wrote_json"),
    revertedAt: timestamp("reverted_at", { withTimezone: true }),
    ok: boolean("ok").notNull().default(true),
  },
  (table) => [index("runs_user_idx").on(table.userId, table.startedAt)],
);
