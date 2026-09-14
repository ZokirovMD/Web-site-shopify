import { defineConfig } from "drizzle-kit";

/**
 * DATABASE_URL приходит из окружения Vercel и никогда не попадает в репозиторий.
 * Пока его нет, схему можно писать и генерировать миграции локально нельзя —
 * drizzle-kit требует строку подключения.
 */
export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
