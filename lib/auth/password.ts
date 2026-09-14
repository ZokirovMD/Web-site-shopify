import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id = 2 в перечислении библиотеки.
 *
 * Числом, а не через `Algorithm.Argon2id`: там ambient const enum, а при
 * isolatedModules к таким обращаться нельзя — компилятор не может вкомпилировать
 * значение, не видя всего проекта целиком.
 */
const ARGON2ID = 2;

/**
 * ORBIT — пароли.
 *
 * argon2id: устойчив и к перебору на видеокартах, и к атакам по побочным каналам.
 * Параметры — рекомендация OWASP на 2024+: 19 МиБ памяти, 2 итерации,
 * параллелизм 1. Память здесь важнее итераций: именно она делает перебор
 * на GPU невыгодным.
 */
const OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export async function verifyPassword(digest: string, plain: string): Promise<boolean> {
  // Пустой хеш означает «пароль ещё не задан» — это не ошибка, а состояние
  // первого входа. Отдаём false, не бросая: вызывающий сам решает, что делать.
  if (!digest) return false;
  try {
    return await verify(digest, plain, OPTIONS);
  } catch {
    // Битый или чужой формат хеша. Молча отказываем, а не падаем —
    // иначе форма входа покажет стек вместо «пароль не подошёл».
    return false;
  }
}
