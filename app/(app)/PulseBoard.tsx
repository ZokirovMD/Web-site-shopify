"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { Bar, Label, Node, Numeral, Tile } from "@/design/primitives";
import { GirihEmpty } from "@/design/GirihEmpty";
import { addDays, type CalendarDate } from "@/core/date";
import { format, subtract, type CurrencyCode, type Money } from "@/core/money";
import {
  balanceOn,
  burnRate,
  firstShortfall,
  fundedOn,
  safeToSpend,
  type DailyBalance,
} from "@/core/projection";
import type { GoalRow } from "@/db/queries/money";
import { ProjectionScrubber } from "./ProjectionScrubber";
import styles from "./page.module.css";

const HORIZON_DAYS = 90;

/**
 * ПУЛЬС — один экран на день.
 *
 * Проекция считается на сервере и приезжает готовым рядом: скраббер только
 * выбирает день из уже посчитанного, поэтому тянется мгновенно и не ходит
 * в сеть на каждый пиксель.
 *
 * Демонстрационных данных здесь нет. Пусто — значит пусто, и пустое состояние
 * говорит, что сделать, а не изображает заполненную систему.
 */
export function PulseBoard({
  series,
  start,
  currency,
  buffer,
  goals,
}: {
  series: readonly DailyBalance[];
  start: CalendarDate;
  currency: CurrencyCode;
  buffer: Money;
  goals: readonly GoalRow[];
}) {
  const [days, setDays] = useState(31);
  const t = useTranslations("pulse");
  const formatter = useFormatter();

  /** Полдень UTC: любой сдвиг пояса остаётся внутри тех же суток. */
  const atNoon = (date: CalendarDate) => new Date(`${date}T12:00:00Z`);
  const humanDate = (date: CalendarDate) => formatter.dateTime(atNoon(date), "day");

  const header = (withAction: boolean) => (
    <header className={styles.pageHead}>
      <div>
        <p className="o-label">{t("title")}</p>
        <span className={styles.date}>
          {formatter.dateTime(atNoon(start), "weekday")}
        </span>
      </div>
      {/* На пустом экране кнопка не нужна: призыв уже стоит ниже, крупно,
          и две одинаковые ссылки рядом только мешают выбрать. */}
      {withAction ? (
        <Link href="/dengi" className={styles.quickEntry}>
          {t("openMoney")}
        </Link>
      ) : null}
    </header>
  );

  if (series.length === 0) {
    return (
      <div className={styles.page}>
        {header(false)}
        <div className={styles.blank}>
          <GirihEmpty size={168} />
          <div className={styles.blankText}>
            <h1 className={styles.blankTitle}>{t("noAccounts.title")}</h1>
            <p className={styles.blankBody}>{t("noAccounts.body")}</p>
            <Link href="/dengi" className={styles.blankAction}>
              {t("noAccounts.action")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const balanceNow = series[0]?.closing ?? null;
  const targetDate = addDays(start, days);
  const projected = balanceOn(series, targetDate);
  const burn = burnRate(series, currency);
  const safe = safeToSpend(series, buffer, currency);
  const shortfall = firstShortfall(series);

  return (
    <div className={styles.page}>
      {header(true)}

      <section className={styles.moneyLine}>
        <div className={styles.moneyPrimary}>
          <Label>{t("balanceNow")}</Label>
          <span className={styles.balance}>
            {balanceNow ? format(balanceNow, { currency: false }) : t("noValue")}
            <span className="o-numeral__currency">{currency}</span>
          </span>
        </div>

        <div className={styles.moneySecondary}>
          <div className={styles.cell}>
            <Label>{t("balanceProjectedOn", { date: humanDate(targetDate) })}</Label>
            {/* Это остаток на дату, а не прирост — поэтому без знака «плюс».
                Направление читается цветом И подписью, никогда одним цветом. */}
            <span
              className={`${styles.cellValue} ${
                projected && projected.amount < 0 ? styles.out : styles.in
              }`}
            >
              {projected ? format(projected, { currency: false }) : t("noValue")}
            </span>
          </div>
          <div className={styles.cell}>
            <Label>{t("burnDaily")}</Label>
            <span className={styles.cellValue}>{format(burn, { currency: false })}</span>
          </div>
          <div className={styles.cell}>
            <Label>{t("safeToSpend")}</Label>
            <span className={`${styles.cellValue} ${styles.in}`}>
              {format(safe, { currency: false })}
            </span>
          </div>
          {shortfall ? (
            <div className={styles.cell}>
              <Label>{t("shortfall")}</Label>
              <span className={`${styles.cellValue} ${styles.out}`}>
                {humanDate(shortfall)}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <ProjectionScrubber
        label={t("scrubber")}
        hint={t("scrubberHint")}
        todayLabel={t("today")}
        maxDays={Math.min(HORIZON_DAYS, series.length - 1)}
        defaultDays={31}
        onChange={setDays}
        formatDay={(value) => t("plusDays", { days: value })}
      />

      {goals.length > 0 ? (
        <section className={styles.tiles}>
          <Tile>
            <div className={styles.tileHead}>
              <Node role="lapis" />
              <span className={styles.tileTitle}>{t("goals").toUpperCase()}</span>
            </div>
            {goals.map((goal) => {
              const remaining = subtract(goal.target, goal.saved);
              const funded = fundedOn(series, remaining, buffer);
              const percent =
                goal.target.amount === 0
                  ? 0
                  : Math.round((goal.saved.amount / goal.target.amount) * 100);

              return (
                <div key={goal.id} className={styles.goalRow}>
                  <div className={styles.goalHead}>
                    <span>{goal.title}</span>
                    <span className={styles.goalWhen}>
                      {funded ? humanDate(funded) : t("notOnHorizon")}
                    </span>
                  </div>
                  <Bar
                    value={goal.saved.amount}
                    max={goal.target.amount}
                    label={goal.title}
                  />
                  <div className={styles.row}>
                    <Numeral
                      value={goal.saved}
                      size="var(--text-caption)"
                      showCurrency={false}
                    />
                    <span className={styles.rowMeta}>
                      {t("goalProgress", {
                        percent,
                        target: format(goal.target, { currency: false }),
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </Tile>
        </section>
      ) : null}

      <p className={styles.synthetic}>
        <Node role="faint" />
        {t("coming")}
      </p>
    </div>
  );
}
