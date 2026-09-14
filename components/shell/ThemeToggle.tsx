"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { polygon, toPath } from "@/design/girih";
import styles from "./ThemeToggle.module.css";

type Theme = "system" | "light" | "dark";

const ORDER: readonly Theme[] = ["system", "light", "dark"];
const FILL: Record<Theme, string> = {
  system: "none",
  light: "var(--ochre)",
  dark: "var(--lapis)",
};

/**
 * Три состояния, а не два: «как в системе» — это отдельное состояние,
 * а не отсутствие выбора. Переключатель на два положения не даёт вернуться
 * к системной, и человек застревает в той теме, которую нажал однажды.
 *
 * Глиф — декагон из того же генератора, что фон и пустые состояния.
 * Пустой контур — системная, охра — светлая, лазурь — тёмная.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const t = useTranslations("shell.theme");
  const label = `${t("toggle")}: ${t(theme)}`;

  useEffect(() => {
    const saved = readTheme();
    setTheme(saved);
    apply(saved);
  }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]!;
    setTheme(next);
    apply(next);
    try {
      window.localStorage.setItem("orbit-theme", next);
    } catch {
      // приватный режим или заблокированное хранилище:
      // тема просто не переживёт перезагрузку, ломать из-за этого нечего
    }
  };

  const decagon = toPath(polygon(9, 9, 8, 10));

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={cycle}
      aria-label={label}
      title={label}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path d={decagon} fill={FILL[theme]} stroke="var(--line-strong)" strokeWidth="1" />
      </svg>
    </button>
  );
}

function readTheme(): Theme {
  try {
    const value = window.localStorage.getItem("orbit-theme");
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // недоступное хранилище — возвращаем системную
  }
  return "system";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}
