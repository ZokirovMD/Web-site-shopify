/**
 * ORBIT — примитивы гириха как React-компоненты.
 * Пять плиток гириха → пять примитивов. См. docs/BRANDBOOK.md §1 и §6.
 *
 * Здесь нет ни одного литерала цвета, размера или отступа: всё живёт
 * в design/tokens.css и design/primitives.css.
 */
import type { CSSProperties, ReactNode } from "react";
import { format, type Money } from "@/core/money";

type Role = "lapis" | "turquoise" | "ochre" | "pomegranate" | "ink" | "muted" | "faint";

const ROLE_VAR: Record<Role, string> = {
  lapis: "var(--lapis)",
  turquoise: "var(--turquoise)",
  ochre: "var(--ochre)",
  pomegranate: "var(--pomegranate)",
  ink: "var(--ink)",
  muted: "var(--ink-muted)",
  faint: "var(--ink-faint)",
};

/* ---- Tile (пентагон) ------------------------------------------------------- */

export function Tile({
  children,
  interactive = false,
  className,
  style,
}: {
  children: ReactNode;
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className ? `o-tile ${className}` : "o-tile"}
      data-interactive={interactive}
      style={style}
    >
      {children}
    </div>
  );
}

/* ---- Strap (бабочка) ------------------------------------------------------- */

export function Strap({ style }: { style?: CSSProperties }) {
  return <hr className="o-strap" style={style} />;
}

/* ---- Node (декагон) --------------------------------------------------------
   Отметка привычки, чекбокс, точка данных, маркер модуля. */

export function Node({
  role = "ink",
  filled = true,
  label,
}: {
  role?: Role;
  filled?: boolean;
  label?: string;
}) {
  return (
    <span
      className="o-node"
      data-state={filled ? "filled" : "empty"}
      style={{ color: ROLE_VAR[role] }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

/* ---- Bar (шестиугольник) --------------------------------------------------- */

export function Bar({
  value,
  max,
  role = "turquoise",
  label,
}: {
  value: number;
  max: number;
  role?: Role;
  label: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className="o-bar"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="o-bar__fill"
        style={{ width: `${pct}%`, background: ROLE_VAR[role] }}
      />
    </div>
  );
}

/* ---- Mark (ромб) -----------------------------------------------------------
   Метка дедлайна. Форма не меняется — меняется только заливка.
   Смысл никогда не несётся одним цветом: рядом всегда есть текст. */

export function Mark({ role = "faint", label }: { role?: Role; label?: string }) {
  return (
    <span
      className="o-mark"
      style={{ color: ROLE_VAR[role] }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

/* ---- Numeral ---------------------------------------------------------------
   Деньги. Табличные цифры обязательны: колонка, в которой цифры пляшут, — дефект. */

export function Numeral({
  value,
  size = "var(--text-display-2)",
  direction,
  showSign = false,
  showCurrency = true,
}: {
  value: Money;
  size?: string;
  direction?: "in" | "out";
  showSign?: boolean;
  showCurrency?: boolean;
}) {
  const text = format(value, { sign: showSign, currency: false });
  return (
    <span className="o-numeral" data-direction={direction} style={{ fontSize: size }}>
      {text}
      {showCurrency ? <span className="o-numeral__currency">{value.currency}</span> : null}
    </span>
  );
}

/* ---- Label ------------------------------------------------------------------ */

export function Label({ children }: { children: ReactNode }) {
  return <span className="o-label">{children}</span>;
}
