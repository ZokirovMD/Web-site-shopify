"use client";

import { useId, useState } from "react";
import styles from "./ProjectionScrubber.module.css";

/**
 * ПРОЕКЦИЯ — сигнатурное взаимодействие ORBIT.
 *
 * Тянешь тесьму вперёд по времени, и каждое число на экране пересчитывается
 * на выбранный день. Механизм продукта, сделанный физическим.
 *
 * Движение 1:1 с курсором, без сглаживания: это инструмент прямого управления,
 * и любая инерция здесь читается как лаг (docs/BRANDBOOK.md §8).
 */
export function ProjectionScrubber({
  maxDays = 90,
  defaultDays = 31,
  onChange,
  label,
  hint,
  todayLabel,
  formatDay,
}: {
  maxDays?: number;
  defaultDays?: number;
  onChange?: (days: number) => void;
  label: string;
  hint: string;
  todayLabel: string;
  formatDay: (days: number) => string;
}) {
  const [days, setDays] = useState(defaultDays);
  const id = useId();

  const handle = (value: number) => {
    setDays(value);
    onChange?.(value);
  };

  const pct = (days / maxDays) * 100;

  return (
    <div className={styles.scrubber}>
      <div className={styles.head}>
        <label className="o-label" htmlFor={id}>
          {label}
        </label>
        <span className={styles.hint}>{hint}</span>
      </div>

      <div className={styles.trackWrap}>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.filled} style={{ width: `${pct}%` }} />
          <span className={styles.node} style={{ left: `${pct}%` }} />
        </div>
        <input
          id={id}
          className={styles.input}
          type="range"
          min={0}
          max={maxDays}
          step={1}
          value={days}
          onChange={(event) => handle(Number(event.target.value))}
          aria-label={label}
          aria-valuetext={formatDay(days)}
        />
      </div>

      <div className={styles.ends}>
        <span>{todayLabel}</span>
        <span>{formatDay(days)}</span>
      </div>
    </div>
  );
}
