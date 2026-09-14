"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword, passwordProblem, verifyPassword } from "./password";
import {
  createSession,
  currentUser,
  destroySession,
  recordAttempt,
  tooManyAttempts,
} from "./session";

export interface FormState {
  error?: string;
  ok?: boolean;
}

/**
 * Zod на границе: данные приходят из браузера, им нельзя верить.
 * Пароль не обрезаем и не нормализуем — любое изменение строки пользователя
 * до хеширования это будущая невозможность войти.
 */
const credentials = z.object({
  email: z.string().trim().toLowerCase().email("Это не похоже на почту"),
  password: z.string().min(1, "Введи пароль"),
});

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = credentials.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверь поля" };
  }

  const { email, password } = parsed.data;

  if (await tooManyAttempts(email)) {
    return { error: "Слишком много попыток. Подожди 15 минут" };
  }

  const rows = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = rows[0];

  /**
   * Один и тот же ответ и на «нет такого пользователя», и на «пароль не тот».
   * Разные тексты превращают форму входа в проверку, зарегистрирован ли адрес.
   */
  const ok = user ? await verifyPassword(user.passwordHash, password) : false;

  await recordAttempt(email, ok);
  if (!ok || !user) return { error: "Почта или пароль не подошли" };

  await createSession(user.id);
  redirect("/");
}

/**
 * Первый вход: пароль в базе не задан.
 *
 * Владелец задаёт его сам на экране входа — так пароль не проходит
 * ни через чат, ни через переписку, ни через мои руки.
 */
const firstPassword = z
  .object({
    email: z.string().trim().toLowerCase().email("Это не похоже на почту"),
    password: z.string(),
    repeat: z.string(),
  })
  .refine((v) => v.password === v.repeat, {
    message: "Пароли не совпали",
    path: ["repeat"],
  });

export async function setFirstPassword(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = firstPassword.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    repeat: form.get("repeat"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверь поля" };
  }

  const { email, password } = parsed.data;

  const problem = passwordProblem(password);
  if (problem) return { error: problem };

  const rows = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = rows[0];
  if (!user) return { error: "Почта или пароль не подошли" };

  // Пароль уже задан — сюда попадать нельзя, иначе это сброс пароля без проверки.
  if (user.passwordHash.length > 0) {
    return { error: "Пароль уже задан. Войди обычным способом" };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(users.id, user.id));

  await createSession(user.id);
  redirect("/");
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/vhod");
}

/** Нужен ли экран «задай пароль»: пользователь есть, хеша нет. */
export async function needsFirstPassword(): Promise<boolean> {
  const rows = await db.select({ passwordHash: users.passwordHash }).from(users).limit(1);
  const row = rows[0];
  return row !== undefined && row.passwordHash.length === 0;
}

export { currentUser };
