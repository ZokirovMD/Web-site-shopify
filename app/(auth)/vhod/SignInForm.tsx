"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { GirihEmpty } from "@/design/GirihEmpty";
import { setFirstPassword, signIn, type FormState } from "@/lib/auth/actions";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth/rules";
import styles from "./page.module.css";

const EMPTY: FormState = {};

export function SignInForm({ first }: { first: boolean }) {
  const action = first ? setFirstPassword : signIn;
  const [state, submit, pending] = useActionState(action, EMPTY);
  const t = useTranslations("auth");
  /**
   * Действие возвращает ключ, а фразу подставляем здесь. Лишние значения ICU
   * игнорирует, поэтому min и max можно передавать всегда.
   */
  const problem = state.error
    ? t(`errors.${state.error}`, { min: PASSWORD_MIN, max: PASSWORD_MAX })
    : null;

  return (
    <form className={styles.card} action={submit}>
      <div className={styles.mark}>
        <GirihEmpty size={120} />
      </div>

      <p className="o-label">{first ? t("firstEyebrow") : t("eyebrow")}</p>
      <h1 className={styles.title}>{first ? t("firstTitle") : t("title")}</h1>

      {first ? <p className={styles.hint}>{t("firstHint")}</p> : null}

      <label className={styles.field}>
        <span className="o-label">{t("email")}</span>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("password")}</span>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={first ? "new-password" : "current-password"}
          required
          className={styles.input}
        />
      </label>

      {first ? (
        <label className={styles.field}>
          <span className="o-label">{t("repeat")}</span>
          <input
            id="repeat"
            name="repeat"
            type="password"
            autoComplete="new-password"
            required
            className={styles.input}
          />
        </label>
      ) : null}

      {problem ? (
        <p className={styles.error} role="alert">
          {problem}
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? t("pending") : first ? t("firstSubmit") : t("signIn")}
      </button>

      {first ? <p className={styles.foot}>{t("rule", { min: PASSWORD_MIN })}</p> : null}
    </form>
  );
}
