import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { loginAttempts, sessions, users } from "@/db/schema";

import { SESSION_COOKIE, SESSION_DAYS } from "./constants";

export { SESSION_COOKIE };

/**
 * ORBIT — сессии.
 *
 * В базе лежит НЕ токен, а его sha256. Утечка таблицы sessions не даёт войти:
 * из хеша токен не восстановить. Сам токен живёт только в httpOnly-куке,
 * куда не дотянется никакой скрипт на странице.
 */
function digest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await db.insert(sessions).values({ userId, tokenHash: digest(token), expiresAt });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  hasPassword: boolean;
}

export async function currentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, digest(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    hasPassword: row.passwordHash.length > 0,
  };
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, digest(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/**
 * Ограничение попыток входа.
 *
 * Счётчик живёт в БАЗЕ, а не в памяти процесса: на serverless память
 * не переживает вызов, и лимит в памяти защищает ровно от нуля попыток.
 */
const WINDOW_MINUTES = 15;
const MAX_FAILURES = 8;

export async function tooManyAttempts(email: string): Promise<boolean> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email.toLowerCase()),
        eq(loginAttempts.succeeded, "false"),
        gt(loginAttempts.attemptedAt, new Date(Date.now() - WINDOW_MINUTES * 60_000)),
      ),
    );
  return (rows[0]?.count ?? 0) >= MAX_FAILURES;
}

export async function recordAttempt(email: string, succeeded: boolean): Promise<void> {
  await db
    .insert(loginAttempts)
    .values({ email: email.toLowerCase(), succeeded: succeeded ? "true" : "false" });
}

/**
 * Сравнение строк за постоянное время. Обычное === выходит раньше на первом
 * несовпавшем байте, и по времени ответа можно угадывать значение по символу.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
