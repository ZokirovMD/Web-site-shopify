"use client";

import { useMemo, useState } from "react";
import { useFormatter, useTimeZone, useTranslations } from "next-intl";
import { Bar, Label, Mark, Node, Numeral, Tile } from "@/design/primitives";
import { addDays, todayIn, type CalendarDate } from "@/core/date";
import { format, subtract } from "@/core/money";
import { TIME_ZONE } from "@/i18n/config";
import {
  balanceOn,
  burnRate,
  firstShortfall,
  fundedOn,
  project,
  safeToSpend,
} from "@/core/projection";
import {
  DEMO_ACCOUNTS,
  DEMO_BUFFER,
  DEMO_GOAL,
  DEMO_HABITS,
  DEMO_OBLIGATIONS,
  DEMO_RATES,
  demoRules,
} from "./demo-data";
import { ProjectionScrubber } from "./ProjectionScrubber";
import styles from "./page.module.css";

const HORIZON_DAYS = 90;
const CURRENCY = "UZS" as const;

const URGENCY_ROLE = {
  attention: "ochre",
  normal: "faint",
} as const;

export function PulseBoard() {
  const [days, setDays] = useState(31);
  const t = useTranslations("pulse");
  const tc = useTranslations("common");
  const formatter = useFormatter();
  // Пояс задан в i18n/request.ts, но тип допускает его отсутствие —
  // подстраховываемся той же константой, а не поясом машины.
  const timeZone = useTimeZone() ?? TIME_ZONE;

  /**
   * Настоящий движок проекций из core/projection — тот же, что обслуживает
   * цели и сметы бизнеса. Экран ничего не считает сам.
   *
   * Пояс задан явно: сервер в UTC и браузер в Ташкенте иначе взяли бы разные
   * «сегодня», и вся проекция разъехалась бы на день.
   */
  const { series, start } = useMemo(() => {
    const from = todayIn(timeZone);
    return {
      start: from,
      series: project({
        from,
        to: addDays(from, HORIZON_DAYS),
        accounts: DEMO_ACCOUNTS,
        transactions: [],
        rules: demoRules(from),
        rates: DEMO_RATES,
        currency: CURRENCY,
      }),
    };
  }, [timeZone]);

  const balanceNow = series[0]?.closing ?? null;
  const targetDate = addDays(start, days);
  const projected = balanceOn(series, targetDate);
  const burn = burnRate(series, CURRENCY);
  const safe = safeToSpend(series, DEMO_BUFFER, CURRENCY);
  const shortfall = firstShortfall(series);

  const goalRemaining = subtract(DEMO_GOAL.target, DEMO_GOAL.saved);
  const goalFunded = fundedOn(series, goalRemaining, DEMO_BUFFER);
  const goalPct = Math.round((DEMO_GOAL.saved.amount / DEMO_GOAL.target.amount) * 100);

  /** Полдень UTC: любой сдвиг пояса остаётся внутри тех же суток. */
  const atNoon = (date: CalendarDate) => new Date(`${date}T12:00:00Z`);
  const humanDate = (date: CalendarDate) => formatter.dateTime(atNoon(date), "day");

  return (
    <div className={styles.page}>
      {/* Знак и навигация живут в оболочке (components/shell/TopStrap).
          Здесь только то, что принадлежит самому ПУЛЬСУ. */}
      <header className={styles.pageHead}>
        <div>
          <p className="o-label">{t("title")}</p>
          <span className={styles.date}>
            {formatter.dateTime(atNoon(start), "weekday")}
          </span>
        </div>
        <button type="button" className={styles.quickEntry}>
          {tc("add")}
        </button>
      </header>

      <section className={styles.moneyLine}>
        <div className={styles.moneyPrimary}>
          <Label>{t("balanceNow")}</Label>
          <span className={styles.balance}>
            {balanceNow ? format(balanceNow, { currency: false }) : t("noValue")}
            <span className="o-numeral__currency">{CURRENCY}</span>
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
        maxDays={HORIZON_DAYS}
        defaultDays={31}
        onChange={setDays}
        formatDay={(value) => t("plusDays", { days: value })}
      />

      <section className={styles.tiles}>
        <Tile>
          <div className={styles.tileHead}>
            <Node role="ochre" />
            <span className={styles.tileTitle}>{t("obligations").toUpperCase()}</span>
          </div>
          <div className={styles.rows}>
            {DEMO_OBLIGATIONS.map((item) => (
              <div key={item.title} className={styles.row}>
                <Mark role={URGENCY_ROLE[item.urgency]} />
                <span>{item.title}</span>
                <span className={styles.rowMeta}>{item.when}</span>
              </div>
            ))}
          </div>
        </Tile>

        <Tile>
          <div className={styles.tileHead}>
            <Node role="turquoise" />
            <span className={styles.tileTitle}>{t("habits").toUpperCase()}</span>
          </div>
          <div className={styles.rows}>
            {DEMO_HABITS.map((item) => (
              <div key={item.title} className={styles.row}>
                <Node role={item.done ? "turquoise" : "faint"} filled={item.done} />
                <span>{item.title}</span>
                <span className={styles.rowMeta}>{t("streak", { days: item.streak })}</span>
              </div>
            ))}
          </div>
        </Tile>

        <Tile>
          <div className={styles.tileHead}>
            <Node role="lapis" />
            <span className={styles.tileTitle}>{t("goals").toUpperCase()}</span>
          </div>
          <div className={styles.goalRow}>
            <div className={styles.goalHead}>
              <span>{DEMO_GOAL.title}</span>
              <span className={styles.goalWhen}>
                {goalFunded ? humanDate(goalFunded) : t("notOnHorizon")}
              </span>
            </div>
            <Bar
              value={DEMO_GOAL.saved.amount}
              max={DEMO_GOAL.target.amount}
              label={DEMO_GOAL.title}
            />
            <div className={styles.row}>
              <Numeral
                value={DEMO_GOAL.saved}
                size="var(--text-caption)"
                showCurrency={false}
              />
              <span className={styles.rowMeta}>
                {t("goalProgress", {
                  percent: goalPct,
                  target: format(DEMO_GOAL.target, { currency: false }),
                })}
              </span>
            </div>
          </div>
        </Tile>
      </section>

      <p className={styles.synthetic}>
        <Node role="faint" />
        {tc("syntheticNote")}
      </p>
    </div>
  );
}
