/**
 * ORBIT — требования к паролю.
 *
 * Отдельный файл от `password.ts` намеренно: там `@node-rs/argon2`, нативный
 * модуль, которому нечего делать в браузерном бандле. Форма входа показывает
 * правило и переводит ошибку, значит правило обязано быть чистым и переносимым.
 * Ровно тот же приём, что с `constants.ts` для middleware на edge.
 */

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;

/** Ключ в словаре, а не готовая фраза: текст живёт в i18n, см. `auth.errors`. */
export type PasswordProblem = "tooShort" | "tooLong" | "digitsOnly";

/** Минимальные требования. Длина важнее состава символов. */
export function passwordProblem(plain: string): PasswordProblem | null {
  if (plain.length < PASSWORD_MIN) return "tooShort";
  if (plain.length > PASSWORD_MAX) return "tooLong";
  if (/^\d+$/.test(plain)) return "digitsOnly";
  return null;
}
