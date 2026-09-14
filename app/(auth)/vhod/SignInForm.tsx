"use client";

import { useActionState } from "react";
import { GirihEmpty } from "@/design/GirihEmpty";
import { setFirstPassword, signIn, type FormState } from "@/lib/auth/actions";
import styles from "./page.module.css";

const EMPTY: FormState = {};

export function SignInForm({ first }: { first: boolean }) {
  const action = first ? setFirstPassword : signIn;
  const [state, submit, pending] = useActionState(action, EMPTY);

  return (
    <form className={styles.card} action={submit}>
      <div className={styles.mark}>
        <GirihEmpty size={120} />
      </div>

      <p className="o-label">{first ? "Первый вход" : "ORBIT"}</p>
      <h1 className={styles.title}>{first ? "Задай пароль" : "Вход"}</h1>

      {first ? (
        <p className={styles.hint}>
          Пароль ты задаёшь сам, здесь и сейчас. Я его не знаю и знать не должен:
          так он не проходит ни через чат, ни через переписку.
        </p>
      ) : null}

      <label className={styles.field}>
        <span className="o-label">Почта</span>
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
        <span className="o-label">Пароль</span>
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
          <span className="o-label">Ещё раз</span>
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

      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Проверяю" : first ? "Задать пароль и войти" : "Войти"}
      </button>

      {first ? (
        <p className={styles.foot}>Минимум 10 символов. Длина важнее спецсимволов.</p>
      ) : null}
    </form>
  );
}
