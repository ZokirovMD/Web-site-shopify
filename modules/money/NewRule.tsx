"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { CalendarDate } from "@/core/date";
import type { AccountRow, Dictionaries } from "@/db/queries/money";
import { addRule, type MoneyFormState } from "./actions";
import { CategorySelect } from "./CategorySelect";
import styles from "./money.module.css";

const EMPTY: MoneyFormState = {};
const CADENCES = ["daily", "weekly", "monthly", "yearly"] as const;

/**
 * Новое правило.
 *
 * «50 000 в день» объявляется один раз и разворачивается в проекцию на весь
 * горизонт. Это первый из двух механизмов, ради которых строится вся система.
 *
 * Поле «число месяца» показывается только у месячного правила: у ежедневного
 * оно бессмысленно, а невидимое поле, которое всё равно уходит на сервер, —
 * источник тихих ошибок.
 */
export function NewRule({
  accounts,
  dictionaries,
  today,
}: {
  accounts: readonly AccountRow[];
  dictionaries: Dictionaries;
  today: CalendarDate;
}) {
  const t = useTranslations("money");
  const [state, submit, pending] = useActionState(addRule, EMPTY);
  const [cadence, setCadence] = useState<(typeof CADENCES)[number]>("monthly");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={submit} className={styles.form}>
      <label className={`${styles.field} ${styles.fieldWide}`}>
        <span className="o-label">{t("rules.name")}</span>
        <input name="name" required autoComplete="off" className={styles.input} />
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("entry.amount")}</span>
        <input
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          required
          placeholder={t("entry.amountHint")}
          className={`${styles.input} ${styles.amount}`}
        />
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("entry.direction")}</span>
        <select name="direction" defaultValue="out" className={styles.select}>
          <option value="out">{t("entry.out")}</option>
          <option value="in">{t("entry.in")}</option>
        </select>
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("entry.account")}</span>
        <select name="accountId" className={styles.select} required>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("rules.cadence")}</span>
        <select
          name="cadence"
          value={cadence}
          onChange={(event) =>
            setCadence(event.target.value as (typeof CADENCES)[number])
          }
          className={styles.select}
        >
          {CADENCES.map((item) => (
            <option key={item} value={item}>
              {t(`rules.cadences.${item}`)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("rules.interval")}</span>
        <input
          name="interval"
          type="number"
          min={1}
          max={365}
          defaultValue={1}
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("rules.anchor")}</span>
        <input
          name="anchorDate"
          type="date"
          defaultValue={today}
          required
          className={styles.input}
        />
      </label>

      {cadence === "monthly" ? (
        <label className={styles.field}>
          <span className="o-label">{t("rules.dayOfMonth")}</span>
          <input
            name="dayOfMonth"
            type="number"
            min={1}
            max={31}
            className={styles.input}
          />
          <span className={styles.hint}>{t("rules.dayOfMonthHint")}</span>
        </label>
      ) : null}

      <label className={styles.field}>
        <span className="o-label">{t("entry.category")}</span>
        <CategorySelect categories={dictionaries.categories} />
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("entry.context")}</span>
        <select name="contextId" defaultValue="" className={styles.select}>
          <option value="">{t("entry.none")}</option>
          {dictionaries.contexts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className="o-label">{t("entry.motive")}</span>
        <select name="motiveId" defaultValue="" className={styles.select}>
          <option value="">{t("entry.none")}</option>
          {dictionaries.motives.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
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
