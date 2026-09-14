/**
 * ORBIT — сквозное состояние.
 *
 * Одна строка правды на объект, проекции в модули (docs/LEARNING.md §2).
 * Событие календаря и задача НЕ дублируют заголовок и статус — они держат
 * trackable_id и читают состояние отсюда. Поэтому галочка в любом месте
 * закрывает во всех.
 *
 * Логика переходов живёт в core/trackable и покрыта тестами; база лишь хранит.
 */

import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { auditColumns } from "./shared";

export const trackableKindEnum = pgEnum("trackable_kind", [
  "learning",
  "training",
  "assignment",
  "task",
  "meeting",
  "habit",
]);

export const trackableStatusEnum = pgEnum("trackable_status", [
  "suggested",
  "accepted",
  "planned",
  "doing",
  "done",
  "dropped",
]);

export const trackables = pgTable(
  "trackables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: trackableKindEnum("kind").notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    status: trackableStatusEnum("status").notNull().default("accepted"),
    /** Дни, на которые владелец это запланировал. */
    plannedFor: date("planned_for").array(),
    completedOn: date("completed_on"),
    droppedReason: varchar("dropped_reason", { length: 240 }),
    suggestionId: uuid("suggestion_id"),
    note: text("note"),
    ...auditColumns,
  },
  (table) => [
    index("trackables_user_kind_idx").on(table.userId, table.kind, table.status),
    index("trackables_completed_idx").on(table.userId, table.completedOn),
  ],
);

/* ============================================================================
   ОБУЧЕНИЕ — надстройка над trackables, а не отдельная жизнь
   ============================================================================ */

export const learningKindEnum = pgEnum("learning_kind", [
  "course",
  "book",
  "video",
  "article",
  "mentor",
  "offline",
]);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    levelNow: varchar("level_now", { length: 40 }),
    levelTarget: varchar("level_target", { length: 40 }),
    why: text("why"),
    ...auditColumns,
  },
  (table) => [index("skills_user_idx").on(table.userId)],
);

export const learningItems = pgTable(
  "learning_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Состояние и планирование живут в trackables, здесь только предметные поля. */
    trackableId: uuid("trackable_id")
      .notNull()
      .references(() => trackables.id, { onDelete: "cascade" }),
    kind: learningKindEnum("kind").notNull().default("course"),
    title: varchar("title", { length: 300 }).notNull(),
    url: text("url"),
    /** Провайдер как категория: Coursera, YouTube, конкретный человек. */
    provider: varchar("provider", { length: 120 }),
    skillId: uuid("skill_id").references(() => skills.id, { onDelete: "set null" }),
    /**
     * Подписка на провайдера — это повторяющееся правило в ДЕНЬГАХ.
     * Так она попадает в проекцию и в бюджет на учёбу, а не живёт в блокноте.
     */
    ruleId: uuid("rule_id"),
    estHours: varchar("est_hours", { length: 24 }),
    progressPct: varchar("progress_pct", { length: 8 }),
    rating: varchar("rating", { length: 8 }),
    notes: text("notes"),
    ...auditColumns,
  },
  (table) => [
    index("learning_user_idx").on(table.userId, table.provider),
    index("learning_trackable_idx").on(table.trackableId),
  ],
);
