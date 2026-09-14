"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { CURRENCIES, type CurrencyCode } from "@/core/money";
import { addAccount, type MoneyFormState } from "./actions";
import styles from "./money.module.css";

const EMPTY: MoneyFormState = {};
const KINDS = ["cash", "card", "savings", "business"] as const;
const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

/**
 * Новый счёт.
 *
 * «Сейчас на счёте» — это начальный остаток, от которого движок считает всё
 * остальное. Названо по-человечески: «opening balance» ничего не говорит тому,
 * кто не вёл бухгалтерию.
 */
export function NewAccount() {
  const t = useTranslations("money");
  const [state, submit, pending] = useActionState(addAccount, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={submit} className={styles.form}>
      <label className={styles.field}>
        <span className="o-label">{t("accounts.name")}</span>
        <input name="name" required autoComplete="off" className={styles.input} />
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("accounts.kind")}</span>
        <select name="kind" defaultValue="cash" className={styles.select}>
          {KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {t(`accounts.kinds.${kind}`)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("accounts.currency")}</span>
        <select name="currency" defaultValue="UZS" className={styles.select}>
          {CURRENCY_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("accounts.opening")}</span>
        <input
          name="openingBalance"
          inputMode="decimal"
          autoComplete="off"
          defaultValue=""
          className={`${styles.input} ${styles.amount}`}
        />
        <span className={styles.hint}>{t("accounts.openingHint")}</span>
      </label>

      {state.error ? (
        <p className={styles.error} role="alert">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? t("entry.pending") : t("entry.submit")}
        </button>
      </div>
    </form>
  );
}
