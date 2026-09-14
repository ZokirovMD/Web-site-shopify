"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { setRuleActive } from "./actions";
import styles from "./money.module.css";

/**
 * Включить или выключить правило.
 *
 * Выключенное правило исчезает из проекции, но остаётся в списке: это не
 * удаление. Переход держим в `useTransition`, чтобы кнопка не отзывалась
 * мгновенно, пока сервер ещё пересчитывает — иначе проекция и подпись
 * расходятся на полсекунды, и это видно.
 */
export function RuleToggle({ id, active }: { id: string; active: boolean }) {
  const t = useTranslations("money.rules");
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      className={styles.toggle}
      data-active={active}
      disabled={pending}
      aria-label={active ? t("toggleOff") : t("toggleOn")}
      onClick={() => start(() => void setRuleActive(id, !active))}
    >
      {active ? t("on") : t("off")}
    </button>
  );
}
