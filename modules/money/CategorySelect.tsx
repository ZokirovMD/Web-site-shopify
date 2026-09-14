"use client";

import { useTranslations } from "next-intl";
import type { CategoryRow } from "@/db/queries/money";
import styles from "./money.module.css";

/**
 * Выбор категории.
 *
 * Шестьдесят четыре категории плоским списком — это список, в котором «Реклама»
 * стоит рядом с «Едой» и ничего не говорит. Дерево в `<select>` не бывает,
 * зато бывают группы: корень становится заголовком группы, листья — строками.
 * Родной механизм браузера, работает и с клавиатуры, и на телефоне.
 */
export function CategorySelect({
  categories,
  name = "categoryId",
}: {
  categories: readonly CategoryRow[];
  name?: string;
}) {
  const t = useTranslations("money.entry");

  const roots = categories.filter((item) => item.parentId === null);
  const childrenOf = (rootId: string) =>
    categories.filter((item) => item.parentId === rootId);

  return (
    <select name={name} defaultValue="" className={styles.select}>
      <option value="">{t("none")}</option>
      {roots.map((root) => {
        const children = childrenOf(root.id);
        // У корня без детей группа была бы пустой рамкой вокруг одной строки.
        if (children.length === 0) {
          return (
            <option key={root.id} value={root.id}>
              {root.name}
            </option>
          );
        }
        return (
          <optgroup key={root.id} label={root.name}>
            {/* Сам корень тоже выбирается: «Еда» без уточнения — нормальный ответ. */}
            <option value={root.id}>{root.name}</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
