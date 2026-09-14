"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { CalendarDate } from "@/core/date";
import type { AccountRow, Dictionaries } from "@/db/queries/money";
import { addTransaction, type MoneyFormState } from "./actions";
import { CategorySelect } from "./CategorySelect";
import styles from "./money.module.css";

const EMPTY: MoneyFormState = {};

/**
 * Быстрый ввод операции.
 *
 * Владелец вводит всё руками, поэтому форма обязана занимать секунды, а не
 * быть анкетой. Сумма первая и крупная, направление и счёт рядом, четыре
 * измерения ниже и все необязательные: заставлять размечать каждую покупку
 * воды — верный способ перестать записывать вообще.
 *
 * Дата приходит с сервера уже посчитанной в поясе владельца: `new Date()`
 * в браузере дал бы другой день у тех, кто сидит в другом часовом поясе,
 * и разошёлся бы с проекцией.
 */
export function QuickEntry({
  accounts,
  dictionaries,
  today,
}: {
  accounts: readonly AccountRow[];
  dictionaries: Dictionaries;
  today: CalendarDate;
}) {
  const t = useTranslations("money");
  const [state, submit, pending] = useActionState(addTransaction, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // После успешной записи форма очищается и курсор возвращается в сумму:
  // траты вводят пачкой, а не по одной.
  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    amountRef.current?.focus();
  }, [state.ok]);

  return (
    <form ref={formRef} action={submit} className={styles.form}>
      <label className={styles.field}>
        <span className="o-label">{t("entry.amount")}</span>
        <input
          ref={amountRef}
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
        <span className="o-label">{t("entry.date")}</span>
        <input
          name="occurredOn"
          type="date"
          defaultValue={today}
          required
          className={styles.input}
        />
      </label>

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

      <label className={styles.field}>
        <span className="o-label">{t("entry.place")}</span>
        <input
          name="place"
          autoComplete="off"
          placeholder={t("entry.placeHint")}
          className={styles.input}
        />
      </label>

      <label className={`${styles.field} ${styles.fieldWide}`}>
        <span className="o-label">{t("entry.note")}</span>
        <input name="note" autoComplete="off" className={styles.input} />
      </label>

      {state.error ? (
        <p className={styles.error} role="alert">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}

      <p className={styles.formNote}>{t("entry.fourDimensions")}</p>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? t("entry.pending") : t("entry.submit")}
        </button>
        {state.ok ? (
          <span className={styles.done} role="status">
            {t("entry.done")}
          </span>
        ) : null}
      </div>
    </form>
  );
}
