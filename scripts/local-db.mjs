/**
 * ORBIT — локальная база для просмотра экранов без сети.
 *
 * Контейнер разработки не достаёт до Neon, а смотреть на собранный модуль
 * глазами обязательно: тайпчек не ловит ни перекошенную вёрстку, ни форму
 * шириной 405 пикселей вместо 1140. PGlite — это настоящий Postgres,
 * собранный в WebAssembly: он поднимает схему и посев прямо здесь.
 *
 * Как пользоваться:
 *
 *   1. npm i -D @electric-sql/pglite
 *   2. node --experimental-strip-types scripts/seed-sql.ts > /tmp/seed.json
 *   3. node scripts/local-db.mjs /tmp/seed.json
 *   4. ВРЕМЕННО подменить db/client.ts на PGlite (см. шаблон в конце файла)
 *      и добавить в next.config.ts: serverExternalPackages: ["@electric-sql/pglite"]
 *   5. ORBIT_PGLITE_DIR=/tmp/orbit-pglite npm run dev
 *   6. Взять напечатанный TOKEN и положить в куку orbit_session
 *   7. ВЕРНУТЬ db/client.ts и next.config.ts перед коммитом
 *
 * Подмена временная намеренно: боевой путь к Neon из этого контейнера
 * не проверить, и держать в нём второй драйвер ради удобства разработки —
 * риск не по размеру выгоды. Когда деплой будет зелёным, это можно
 * пересмотреть и сделать выбор драйвера по схеме DATABASE_URL.
 */

import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const dir = process.env.ORBIT_PGLITE_DIR ?? "/tmp/orbit-pglite";
const seedPath = process.argv[2];
const email = process.argv[3] ?? "owner@orbit.local";

if (!seedPath) {
  console.error("Нужен путь к посеву: node scripts/local-db.mjs /tmp/seed.json");
  process.exit(1);
}

const db = new PGlite(dir);

const migration = readFileSync("db/migrations/0000_init.sql", "utf8");
const statements = migration.split("--> statement-breakpoint");
for (const statement of statements) {
  const sql = statement.trim();
  if (sql) await db.exec(sql);
}
console.log(`схема применена: ${statements.length} операторов`);

await db.query(
  "INSERT INTO users (email, password_hash) VALUES ($1, '') ON CONFLICT (email) DO NOTHING",
  [email],
);
const { rows: users } = await db.query("SELECT id FROM users LIMIT 1");
const userId = users[0].id;

await db.query("INSERT INTO settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [
  userId,
]);

const seed = JSON.parse(readFileSync(seedPath, "utf8"));
for (const sql of seed) await db.exec(sql);
console.log(`справочники посеяны: ${seed.length}`);

/**
 * Сессия создаётся здесь, а не через форму входа: пароль владельца через
 * этот скрипт проходить не должен даже локально. В базе лежит только хеш
 * токена — ровно как в бою (см. lib/auth/session.ts).
 */
const token = randomBytes(32).toString("base64url");
await db.query(
  "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '2 days')",
  [userId, createHash("sha256").update(token).digest("hex")],
);

await db.close();

console.log(`\nкаталог базы: ${dir}`);
console.log(`кука orbit_session = ${token}\n`);
console.log(`Шаблон временного db/client.ts:

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

// Экземпляр на globalThis: страница и серверное действие получают разные
// инстансы модуля, а два PGlite на одном каталоге не видят записей друг друга.
const g = globalThis;
const client = (g.__orbitPglite ??= new PGlite(process.env.ORBIT_PGLITE_DIR));
export const db = drizzle(client, { schema });
export { schema };
`);
