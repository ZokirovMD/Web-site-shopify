/**
 * ORBIT — деньги.
 *
 * Трата размечается четырьмя измерениями (docs/FINANCE.md §1):
 * категория, контекст «с кем», повод «зачем», место. Поэтому у операции
 * три ссылки на справочники, а не одна.
 */

import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import {
  auditColumns,
  currencyEnum,
  directionEnum,
  moneyColumn,
  orderKey,
} from "./shared";

export const accountKindEnum = pgEnum("account_kind", [
  "cash",
  "card",
  "savings",
  "business",
]);

export const cadenceEnum = pgEnum("cadence", ["daily", "weekly", "monthly", "yearly"]);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    kind: accountKindEnum("kind").notNull().default("cash"),
    currency: currencyEnum("currency").notNull().default("UZS"),
    openingBalanceMinor: moneyColumn("opening_balance_minor"),
    archived: boolean("archived").notNull().default(false),
    orderKey,
    ...auditColumns,
  },
  (table) => [index("accounts_user_idx").on(table.userId, table.orderKey)],
);

/**
 * Справочники. Стартовое дерево — в core/taxonomy, но живёт оно здесь:
 * владелец правит категории, а зашитый в код список править нельзя.
 */
export const categories = pgTable(
  "categories",
  {
    id: varchar("id", { length: 64 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    direction: directionEnum("direction").notNull().default("out"),
    parentId: varchar("parent_id", { length: 64 }),
    colorRole: varchar("color_role", { length: 24 }),
    archived: boolean("archived").notNull().default(false),
    orderKey,
    ...auditColumns,
  },
  (table) => [
    // Справочник принадлежит пользователю: один и тот же "food.cafe" живёт
    // у каждого свой. Ключ составной, иначе два пользователя не уживутся.
    primaryKey({ columns: [table.userId, table.id] }),
    index("categories_user_idx").on(table.userId, table.direction),
  ],
);

/** «С кем»: один, семья, друзья, университет… Размечает и траты, и события. */
export const contexts = pgTable(
  "contexts",
  {
    id: varchar("id", { length: 64 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    colorRole: varchar("color_role", { length: 24 }),
    orderKey,
    ...auditColumns,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("contexts_user_idx").on(table.userId),
  ],
);

/** «Зачем»: необходимость, вложение, удовольствие, импульс… */
export const motives = pgTable(
  "motives",
  {
    id: varchar("id", { length: 64 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    hint: varchar("hint", { length: 240 }),
    colorRole: varchar("color_role", { length: 24 }),
    orderKey,
    ...auditColumns,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("motives_user_idx").on(table.userId),
  ],
);

export const fxRates = pgTable(
  "fx_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    base: currencyEnum("base").notNull(),
    quote: currencyEnum("quote").notNull(),
    /** Сколько base даёт одну quote. 12500 UZS за 1 USD. Редактируется владельцем. */
    rate: real("rate").notNull(),
    effectiveOn: date("effective_on").notNull(),
    ...auditColumns,
  },
  (table) => [index("fx_rates_user_idx").on(table.userId, table.effectiveOn)],
);

export const recurringRules = pgTable(
  "recurring_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    amountMinor: moneyColumn("amount_minor"),
    currency: currencyEnum("currency").notNull().default("UZS"),
    direction: directionEnum("direction").notNull(),
    cadence: cadenceEnum("cadence").notNull(),
    interval: smallint("interval").notNull().default(1),
    anchorDate: date("anchor_date").notNull(),
    /** Для weekly: дни недели 0..6. */
    weekdayMask: smallint("weekday_mask").array(),
    dayOfMonth: smallint("day_of_month"),
    endsOn: date("ends_on"),
    endsAfterN: integer("ends_after_n"),
    categoryId: varchar("category_id", { length: 64 }),
    contextId: varchar("context_id", { length: 64 }),
    motiveId: varchar("motive_id", { length: 64 }),
    active: boolean("active").notNull().default(true),
    ...auditColumns,
  },
  (table) => [index("rules_user_idx").on(table.userId, table.active)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    occurredOn: date("occurred_on").notNull(),
    amountMinor: moneyColumn("amount_minor"),
    currency: currencyEnum("currency").notNull().default("UZS"),
    direction: directionEnum("direction").notNull(),

    /* четыре измерения */
    categoryId: varchar("category_id", { length: 64 }),
    contextId: varchar("context_id", { length: 64 }),
    motiveId: varchar("motive_id", { length: 64 }),
    place: varchar("place", { length: 160 }),

    note: text("note"),
    /** Метка бизнеса — так вкладка «Деньги» внутри бизнеса собирается без двойного ввода. */
    businessId: uuid("business_id"),
    /**
     * Правило, материализованное в эту операцию. По нему движок проекций
     * понимает, что виртуальное срабатывание уже стало фактом, и не считает дважды.
     */
    ruleId: uuid("rule_id").references(() => recurringRules.id, { onDelete: "set null" }),
    /**
     * Правка создаёт НОВУЮ версию, а не затирает старую: иначе однажды владелец
     * не поймёт, куда делись деньги. Замещённые версии движок пропускает.
     */
    supersededBy: uuid("superseded_by"),
    ...auditColumns,
  },
  (table) => [
    index("tx_user_date_idx").on(table.userId, table.occurredOn),
    index("tx_account_idx").on(table.accountId, table.occurredOn),
    index("tx_category_idx").on(table.userId, table.categoryId),
    index("tx_context_idx").on(table.userId, table.contextId),
    index("tx_rule_idx").on(table.ruleId, table.occurredOn),
  ],
);

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Пусто — общий лимит на всё. Лимит на «food» покрывает «food.cafe». */
    categoryId: varchar("category_id", { length: 64 }),
    limitMinor: moneyColumn("limit_minor"),
    currency: currencyEnum("currency").notNull().default("UZS"),
    ...auditColumns,
  },
  (table) => [index("budgets_user_idx").on(table.userId)],
);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    targetMinor: moneyColumn("target_minor"),
    currency: currencyEnum("currency").notNull().default("UZS"),
    priority: smallint("priority").notNull().default(0),
    targetDate: date("target_date"),
    linkedAccountId: uuid("linked_account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    status: varchar("status", { length: 24 }).notNull().default("active"),
    note: text("note"),
    ...auditColumns,
  },
  (table) => [index("goals_user_idx").on(table.userId, table.status)],
);

export const goalContributions = pgTable(
  "goal_contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    amountMinor: moneyColumn("amount_minor"),
    occurredOn: date("occurred_on").notNull(),
    ...auditColumns,
  },
  (table) => [index("goal_contrib_idx").on(table.goalId, table.occurredOn)],
);
