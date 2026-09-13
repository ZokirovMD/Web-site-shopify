"use client";

import { useMemo, useState } from "react";
import { Bar, Label, Mark, Node, Numeral, Tile } from "@/design/primitives";
import { add, format, fromMajor, scale, type Money } from "@/core/money";
import ru from "@/i18n/ru.json";
import { ProjectionScrubber } from "./ProjectionScrubber";
import styles from "./page.module.css";

/**
 * ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ.
 *
 * Настоящих счетов и операций владельца в системе ещё нет, и выдумывать их нельзя
 * (PRODUCT.md → Evidence on Hand). Эти числа авторские, помечены в интерфейсе
 * и уйдут, как только появится база и реальные данные.
 */
const DEMO = {
  balance: fromMajor(4_820_000, "UZS"),
  dailyBurn: fromMajor(50_000, "UZS"),
  monthlyIncome: fromMajor(2_400_000, "UZS"),
  goal: { title: "Ноутбук", target: fromMajor(14_000_000, "UZS"), saved: fromMajor(5_600_000, "UZS") },
  obligations: [
    { title: "Матанализ — домашка", when: "3 дня", urgency: "attention" as const },
    { title: "Отчёт по практике", when: "9 дней", urgency: "normal" as const },
    { title: "Оплата курса", when: "14 дней", urgency: "normal" as const },
  ],
  habits: [
    { title: "Зал", done: true, streak: 12 },
    { title: "Чтение", done: true, streak: 31 },
    { title: "Английский", done: false, streak: 4 },
  ],
};

const URGENCY_ROLE = {
  attention: "ochre",
  normal: "faint",
} as const;

/**
 * Упрощённая проекция для демонстрации первого экрана.
 * Настоящий движок (core/projection) приходит в Фазе 1 и заменит это целиком —
 * он умеет повторяющиеся правила, календарные месяцы и материализацию.
 */
function projectBalance(base: Money, dailyBurn: Money, monthlyIncome: Money, days: number): Money {
  const spent = scale(dailyBurn, -days);
  const earned = scale(monthlyIncome, days / 30);
  return add(add(base, spent), earned);
}

export function PulseBoard() {
  const [days, setDays] = useState(31);

  const projected = useMemo(
    () => projectBalance(DEMO.balance, DEMO.dailyBurn, DEMO.monthlyIncome, days),
    [days],
  );

  const projectedDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);
  }, [days]);

  const today = useMemo(
    () => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", weekday: "long" }).format(new Date()),
    [],
  );

  const goalPct = Math.round(
    (DEMO.goal.saved.amount / DEMO.goal.target.amount) * 100,
  );

  return (
    <div className={styles.page}>
      <header className={styles.topStrap}>
        <div className={styles.brand}>
          <OrbitMark />
          <span className={styles.brandName}>{ru.brand.name}</span>
        </div>
        <span className={styles.date}>{today}</span>
        <button type="button" className={styles.quickEntry}>
          {ru.common.add}
        </button>
      </header>

      <section className={styles.moneyLine}>
        <div className={styles.moneyPrimary}>
          <Label>{ru.pulse.balanceNow}</Label>
          <span className={styles.balance}>
            {format(DEMO.balance, { currency: false })}
            <span className="o-numeral__currency">UZS</span>
          </span>
        </div>

        <div className={styles.moneySecondary}>
          <div className={styles.cell}>
            <Label>{`${ru.pulse.balanceProjected} · ${projectedDate}`}</Label>
            {/* Это остаток на дату, а не прирост — поэтому без знака «плюс».
                Направление читается цветом И подписью, никогда одним цветом. */}
            <span
              className={`${styles.cellValue} ${projected.amount < 0 ? styles.out : styles.in}`}
            >
              {format(projected, { currency: false })}
            </span>
          </div>
          <div className={styles.cell}>
            <Label>{ru.pulse.incomeMonth}</Label>
            <span className={`${styles.cellValue} ${styles.in}`}>
              {format(DEMO.monthlyIncome, { sign: true, currency: false })}
            </span>
          </div>
          <div className={styles.cell}>
            <Label>{ru.pulse.burnDaily}</Label>
            <span className={styles.cellValue}>
              {format(DEMO.dailyBurn, { currency: false })}
            </span>
          </div>
        </div>
      </section>

      <ProjectionScrubber
        label={ru.pulse.scrubber}
        hint={ru.pulse.scrubberHint}
        todayLabel={ru.pulse.today}
        defaultDays={31}
        onChange={setDays}
        formatDay={(d) => ru.pulse.plusDays.replace("{days}", String(d))}
      />

      <section className={styles.tiles}>
        <Tile>
          <div className={styles.tileHead}>
            <Node role="ochre" />
            <span className={styles.tileTitle}>{ru.pulse.obligations.toUpperCase()}</span>
          </div>
          <div className={styles.rows}>
            {DEMO.obligations.map((item) => (
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
            {DEMO.habits.map((item) => (
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
              <span>{DEMO.goal.title}</span>
              <span className={styles.goalWhen}>{goalPct}%</span>
            </div>
            <Bar
              value={DEMO.goal.saved.amount}
              max={DEMO.goal.target.amount}
              label={DEMO.goal.title}
            />
            <div className={styles.row}>
              <Numeral value={DEMO.goal.saved} size="var(--text-caption)" showCurrency={false} />
              <span className={styles.rowMeta}>
                из {format(DEMO.goal.target, { currency: false })}
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
