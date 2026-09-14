CREATE TYPE "public"."currency" AS ENUM('UZS', 'USD');--> statement-breakpoint
CREATE TYPE "public"."direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('manual', 'claude', 'rule', 'import');--> statement-breakpoint
CREATE TYPE "public"."account_kind" AS ENUM('cash', 'card', 'savings', 'business');--> statement-breakpoint
CREATE TYPE "public"."cadence" AS ENUM('daily', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."learning_kind" AS ENUM('course', 'book', 'video', 'article', 'mentor', 'offline');--> statement-breakpoint
CREATE TYPE "public"."trackable_kind" AS ENUM('learning', 'training', 'assignment', 'task', 'meeting', 'habit');--> statement-breakpoint
CREATE TYPE "public"."trackable_status" AS ENUM('suggested', 'accepted', 'planned', 'doing', 'done', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."stance" AS ENUM('love', 'like', 'neutral', 'dislike', 'never');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('new', 'accepted', 'rejected', 'snoozed');--> statement-breakpoint
CREATE TYPE "public"."thread_status" AS ENUM('open', 'waiting', 'answered', 'closed');--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"succeeded" varchar(5) DEFAULT 'false' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"locale" varchar(8) DEFAULT 'ru' NOT NULL,
	"primary_currency" "currency" DEFAULT 'UZS' NOT NULL,
	"display_currency" "currency" DEFAULT 'UZS' NOT NULL,
	"timezone" varchar(64) DEFAULT 'Asia/Tashkent' NOT NULL,
	"week_start" smallint DEFAULT 1 NOT NULL,
	"theme" varchar(16) DEFAULT 'system' NOT NULL,
	"cash_buffer_minor" bigint DEFAULT 0 NOT NULL,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"kind" "account_kind" DEFAULT 'cash' NOT NULL,
	"currency" "currency" DEFAULT 'UZS' NOT NULL,
	"opening_balance_minor" bigint DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"order_key" varchar(64),
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" varchar(64),
	"limit_minor" bigint DEFAULT 0 NOT NULL,
	"currency" "currency" DEFAULT 'UZS' NOT NULL,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar(64) NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"direction" "direction" DEFAULT 'out' NOT NULL,
	"parent_id" varchar(64),
	"color_role" varchar(24),
	"archived" boolean DEFAULT false NOT NULL,
	"order_key" varchar(64),
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "contexts" (
	"id" varchar(64) NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"color_role" varchar(24),
	"order_key" varchar(64),
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contexts_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"base" "currency" NOT NULL,
	"quote" "currency" NOT NULL,
	"rate" real NOT NULL,
	"effective_on" date NOT NULL,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goal_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"amount_minor" bigint DEFAULT 0 NOT NULL,
	"occurred_on" date NOT NULL,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"target_minor" bigint DEFAULT 0 NOT NULL,
	"currency" "currency" DEFAULT 'UZS' NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"target_date" date,
	"linked_account_id" uuid,
	"status" varchar(24) DEFAULT 'active' NOT NULL,
	"note" text,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motives" (
	"id" varchar(64) NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"hint" varchar(240),
	"color_role" varchar(24),
	"order_key" varchar(64),
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "motives_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "recurring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"amount_minor" bigint DEFAULT 0 NOT NULL,
	"currency" "currency" DEFAULT 'UZS' NOT NULL,
	"direction" "direction" NOT NULL,
	"cadence" "cadence" NOT NULL,
	"interval" smallint DEFAULT 1 NOT NULL,
	"anchor_date" date NOT NULL,
	"weekday_mask" smallint[],
	"day_of_month" smallint,
	"ends_on" date,
	"ends_after_n" integer,
	"category_id" varchar(64),
	"context_id" varchar(64),
	"motive_id" varchar(64),
	"active" boolean DEFAULT true NOT NULL,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"occurred_on" date NOT NULL,
	"amount_minor" bigint DEFAULT 0 NOT NULL,
	"currency" "currency" DEFAULT 'UZS' NOT NULL,
	"direction" "direction" NOT NULL,
	"category_id" varchar(64),
	"context_id" varchar(64),
	"motive_id" varchar(64),
	"place" varchar(160),
	"note" text,
	"business_id" uuid,
	"rule_id" uuid,
	"superseded_by" uuid,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trackable_id" uuid NOT NULL,
	"kind" "learning_kind" DEFAULT 'course' NOT NULL,
	"title" varchar(300) NOT NULL,
	"url" text,
	"provider" varchar(120),
	"skill_id" uuid,
	"rule_id" uuid,
	"est_hours" varchar(24),
	"progress_pct" varchar(8),
	"rating" varchar(8),
	"notes" text,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"level_now" varchar(40),
	"level_target" varchar(40),
	"why" text,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trackables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "trackable_kind" NOT NULL,
	"title" varchar(300) NOT NULL,
	"status" "trackable_status" DEFAULT 'accepted' NOT NULL,
	"planned_for" date[],
	"completed_on" date,
	"dropped_reason" varchar(240),
	"suggestion_id" uuid,
	"note" text,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" varchar(40) NOT NULL,
	"trigger" varchar(24) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"summary" text,
	"wrote_json" jsonb,
	"reverted_at" timestamp with time zone,
	"ok" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic" varchar(160) NOT NULL,
	"stance" "stance" DEFAULT 'neutral' NOT NULL,
	"exception_note" varchar(300),
	"weight" real DEFAULT 1 NOT NULL,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"author" varchar(16) NOT NULL,
	"body_md" text NOT NULL,
	"acted_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "radar_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" varchar(40) NOT NULL,
	"title" varchar(300) NOT NULL,
	"body" text,
	"url" text,
	"source_name" varchar(160),
	"city" varchar(120),
	"happens_on" date,
	"interest_score" real,
	"status" varchar(24) DEFAULT 'new' NOT NULL,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" varchar(40) NOT NULL,
	"title" varchar(300) NOT NULL,
	"body_md" text,
	"rationale" text NOT NULL,
	"source_url" text,
	"est_hours" real,
	"cost_minor" bigint DEFAULT 0 NOT NULL,
	"currency" "currency" DEFAULT 'UZS' NOT NULL,
	"status" "suggestion_status" DEFAULT 'new' NOT NULL,
	"snooze_until" date,
	"rejected_reason" varchar(240),
	"decided_at" timestamp with time zone,
	"materialized_ref" varchar(64),
	"materialized_id" uuid,
	"run_id" uuid,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(300),
	"module_ref" varchar(64),
	"module_id" uuid,
	"status" "thread_status" DEFAULT 'open' NOT NULL,
	"source" "source" DEFAULT 'manual' NOT NULL,
	"source_run" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contexts" ADD CONSTRAINT "contexts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_linked_account_id_accounts_id_fk" FOREIGN KEY ("linked_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motives" ADD CONSTRAINT "motives_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_rule_id_recurring_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."recurring_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_items" ADD CONSTRAINT "learning_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_items" ADD CONSTRAINT "learning_items_trackable_id_trackables_id_fk" FOREIGN KEY ("trackable_id") REFERENCES "public"."trackables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_items" ADD CONSTRAINT "learning_items_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trackables" ADD CONSTRAINT "trackables_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interests" ADD CONSTRAINT "interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radar_items" ADD CONSTRAINT "radar_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "login_attempts_email_idx" ON "login_attempts" USING btree ("email","attempted_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id","order_key");--> statement-breakpoint
CREATE INDEX "budgets_user_idx" ON "budgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_user_idx" ON "categories" USING btree ("user_id","direction");--> statement-breakpoint
CREATE INDEX "contexts_user_idx" ON "contexts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fx_rates_user_idx" ON "fx_rates" USING btree ("user_id","effective_on");--> statement-breakpoint
CREATE INDEX "goal_contrib_idx" ON "goal_contributions" USING btree ("goal_id","occurred_on");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "motives_user_idx" ON "motives" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rules_user_idx" ON "recurring_rules" USING btree ("user_id","active");--> statement-breakpoint
CREATE INDEX "tx_user_date_idx" ON "transactions" USING btree ("user_id","occurred_on");--> statement-breakpoint
CREATE INDEX "tx_account_idx" ON "transactions" USING btree ("account_id","occurred_on");--> statement-breakpoint
CREATE INDEX "tx_category_idx" ON "transactions" USING btree ("user_id","category_id");--> statement-breakpoint
CREATE INDEX "tx_context_idx" ON "transactions" USING btree ("user_id","context_id");--> statement-breakpoint
CREATE INDEX "tx_rule_idx" ON "transactions" USING btree ("rule_id","occurred_on");--> statement-breakpoint
CREATE INDEX "learning_user_idx" ON "learning_items" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "learning_trackable_idx" ON "learning_items" USING btree ("trackable_id");--> statement-breakpoint
CREATE INDEX "skills_user_idx" ON "skills" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trackables_user_kind_idx" ON "trackables" USING btree ("user_id","kind","status");--> statement-breakpoint
CREATE INDEX "trackables_completed_idx" ON "trackables" USING btree ("user_id","completed_on");--> statement-breakpoint
CREATE INDEX "runs_user_idx" ON "agent_runs" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "interests_user_idx" ON "interests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_thread_idx" ON "messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "radar_user_idx" ON "radar_items" USING btree ("user_id","status","happens_on");--> statement-breakpoint
CREATE INDEX "suggestions_user_idx" ON "suggestions" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "threads_user_idx" ON "threads" USING btree ("user_id","status","updated_at");