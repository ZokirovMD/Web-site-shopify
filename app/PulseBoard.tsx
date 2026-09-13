"use client";

import { useMemo, useState } from "react";
import { Bar, Label, Mark, Node, Numeral, Tile } from "@/design/primitives";
import { addDays, today } from "@/core/date";
import { format, subtract } from "@/core/money";
import {
  balanceOn,
  burnRate,
  firstShortfall,
  fundedOn,
  project,
  safeToSpend,
} from "@/core/projection";
import ru from "@/i18n/ru.json";
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

  /**
   * Настоящий движок проекций из core/projection — тот же, что обслуживает
   * цели и сметы бизнеса. Экран ничего не считает сам.
   */
  const { series, start } = useMemo(() => {
    const from = today();
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
  }, []);

  const balanceNow = series[0]?.closing ?? null;
  const targetDate = addDays(start, days);
  const projected = balanceOn(series, targetDate);
  const burn = burnRate(series, CURRENCY);
  const safe = safeToSpend(series, DEMO_BUFFER, CURRENCY);
  const shortfall = firstShortfall(series);

  const goalRemaining = subtract(DEMO_GOAL.target, DEMO_GOAL.saved);
  const goalFunded = fundedOn(series, goalRemaining, DEMO_BUFFER);
  const goalPct = Math.round((DEMO_GOAL.saved.amount / DEMO_GOAL.target.amount) * 100);

  const humanDate = (iso: string) =>
    new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(
      new Date(`${iso}T12:00:00Z`),
    );

  const todayLong = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        weekday: "long",
      }).format(new Date()),
    [],
  );

  return (
    <div className={styles.page}>
      <header className={styles.topStrap}>
        <div className={styles.brand}>
          <OrbitMark />
          <span className={styles.brandName}>{ru.brand.name}</span>
        </div>
        <span className={styles.date}>{todayLong}</span>
        <button type="button" className={styles.quickEntry}>
          {ru.common.add}
        </button>
      </header>

      <section className={styles.moneyLine}>
        <div className={styles.moneyPrimary}>
          <Label>{ru.pulse.balanceNow}</Label>
          <span className={styles.balance}>
            {balanceNow ? format(balanceNow, { currency: false }) : "—"}
            <span className="o-numeral__currency">{CURRENCY}</span>
          </span>
        </div>

        <div className={styles.moneySecondary}>
          <div className={styles.cell}>
            <Label>{`${ru.pulse.balanceProjected} · ${humanDate(targetDate)}`}</Label>
            {/* Это остаток на дату, а не прирост — поэтому без знака «плюс».
                Направление читается цветом И подписью, никогда одним цветом. */}
            <span
              className={`${styles.cellValue} ${
                projected && projected.amount < 0 ? styles.out : styles.in
              }`}
            >
              {projected ? format(projected, { currency: false }) : "—"}
            </span>
          </div>
          <div className={styles.cell}>
            <Label>{ru.pulse.burnDaily}</Label>
            <span className={styles.cellValue}>{format(burn, { currency: false })}</span>
          </div>
          <div className={styles.cell}>
            <Label>{ru.pulse.safeToSpend}</Label>
            <span className={`${styles.cellValue} ${styles.in}`}>
              {format(safe, { currency: false })}
            </span>
          </div>
          {shortfall ? (
            <div className={styles.cell}>
              <Label>{ru.pulse.shortfall}</Label>
              <span className={`${styles.cellValue} ${styles.out}`}>
                {humanDate(shortfall)}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <ProjectionScrubber
        label={ru.pulse.scrubber}
        hint={ru.pulse.scrubberHint}
        todayLabel={ru.pulse.today}
        maxDays={HORIZON_DAYS}
        defaultDays={31}
        onChange={setDays}
        formatDay={(value) => ru.pulse.plusDays.replace("{days}", String(value))}
      />

      <section className={styles.tiles}>
        <Tile>
          <div className={styles.tileHead}>
            <Node role="ochre" />
            <span className={styles.tileTitle}>{ru.pulse.obligations.toUpperCase()}</span>
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
            <span className={styles.tileTitle}>{ru.pulse.habits.toUpperCase()}</span>
          </div>
          <div className={styles.rows}>
            {DEMO_HABITS.map((item) => (
              <div key={item.title} className={styles.row}>
                <Node role={item.done ? "turquoise" : "faint"} filled={item.done} />
                <span>{item.title}</span>
                <span className={styles.rowMeta}>{item.streak} дн</span>
              </div>
            ))}
          </div>
        </Tile>

        <Tile>
          <div className={styles.tileHead}>
            <Node role="lapis" />
            <span className={styles.tileTitle}>{ru.pulse.goals.toUpperCase()}</span>
          </div>
          <div className={styles.goalRow}>
            <div className={styles.goalHead}>
              <span>{DEMO_GOAL.title}</span>
              <span className={styles.goalWhen}>
                {goalFunded ? humanDate(goalFunded) : ru.pulse.notOnHorizon}
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
                {goalPct}% из {format(DEMO_GOAL.target, { currency: false })}
              </span>
            </div>
          </div>
        </Tile>
      </section>

      <p className={styles.synthetic}>
        <Node role="faint" />
        {ru.common.synthetic} — настоящих счетов в системе ещё нет
      </p>
    </div>
  );
}

/** Знак ORBIT: декагон-узел, через который проходит орбитальная тесьма. */
function OrbitMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 3 L30.1 8.2 L36.2 17.5 L34.1 28.4 L25.6 35.5 L14.4 35.5 L5.9 28.4 L3.8 17.5 L9.9 8.2 Z"
        stroke="var(--lapis)"
        strokeWidth="1.4"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="18"
        ry="7.2"
        stroke="var(--ochre)"
        strokeWidth="1.4"
        transform="rotate(-36 20 20)"
      />
      <circle cx="20" cy="20" r="2.2" fill="var(--ink)" />
    </svg>
  );
}
