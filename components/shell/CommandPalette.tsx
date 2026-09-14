"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { NAV } from "./nav";
import styles from "./CommandPalette.module.css";

interface Command {
  id: string;
  label: string;
  hint: string;
  group: string;
  run: () => void;
}

/**
 * ⌘K — быстрый вход куда угодно.
 *
 * Владелец вводит всё руками, значит ввод обязан занимать секунды из любой
 * точки приложения, без перехода в модуль (docs/FINANCE.md §4).
 * Сейчас палитра умеет навигацию; быстрый ввод операции появится в Ф1,
 * когда будет куда писать.
 */
export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(
    () =>
      NAV.map((item) => ({
        id: item.href,
        label: t(`modules.${item.key}.label`),
        hint: t(`modules.${item.key}.hint`),
        group: t("palette.sections"),
        run: () => router.push(item.href),
      })),
    [router, t],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (command) =>
        command.label.toLowerCase().includes(q) || command.hint.toLowerCase().includes(q),
    );
  }, [commands, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCursor(0);
      return;
    }
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  // Держим подсвеченную строку в поле зрения при навигации с клавиатуры.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const picked = results[cursor];
      if (picked) {
        picked.run();
        onClose();
      }
    }
  };

  return (
    <div className={styles.backdrop} onMouseDown={onClose} role="presentation">
      <div
        className={styles.panel}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={t("palette.title")}
      >
        <input
          ref={inputRef}
          id="orbit-palette-input"
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("palette.placeholder")}
          autoComplete="off"
          spellCheck={false}
        />

        <div className={styles.list} ref={listRef}>
          {results.length === 0 ? (
            <p className={styles.nothing}>{t("palette.nothing", { query })}</p>
          ) : (
            results.map((command, index) => (
              <button
                key={command.id}
                type="button"
                data-index={index}
                className={styles.item}
                data-active={index === cursor}
                onMouseEnter={() => setCursor(index)}
                onClick={() => {
                  command.run();
                  onClose();
                }}
              >
                <span className={styles.itemNode} aria-hidden="true" />
                <span className={styles.itemLabel}>{command.label}</span>
                <span className={styles.itemHint}>{command.hint}</span>
              </button>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> {t("palette.pick")}
          </span>
          <span>
            <kbd>↵</kbd> {t("palette.go")}
          </span>
          <span>
            <kbd>esc</kbd> {t("palette.close")}
          </span>
        </div>
      </div>
    </div>
  );
}
