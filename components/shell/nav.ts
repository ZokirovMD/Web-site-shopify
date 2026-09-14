/**
 * ORBIT — карта навигации.
 *
 * Восемь групп из docs/SYSTEM.md §2. Один источник правды: из него строится
 * и верхняя тесьма, и палитра ⌘K. Дублировать список в двух местах —
 * гарантия того, что однажды они разойдутся.
 */

import type { Route } from "next";

export interface NavItem {
  /** Типизированный маршрут: typedRoutes ловит опечатку в ссылке на этапе сборки. */
  href: Route;
  label: string;
  /** Роль цвета из брендбука. Цвет владеет областью, а не рассыпан точками. */
  role: "lapis" | "turquoise" | "ochre" | "pomegranate" | "muted";
  /** Что здесь будет — показывается в ⌘K и в пустом состоянии. */
  summary: string;
  phase: string;
}

export const NAV: readonly NavItem[] = [
  {
    href: "/",
    label: "Пульс",
    role: "lapis",
    summary: "Деньги, обязательства, тренировка, привычки — один экран на день",
    phase: "Ф1",
  },
  {
    href: "/kontur",
    label: "Контур",
    role: "turquoise",
    summary: "Диалог со мной, мои предложения и журнал того, что я сделал сам",
    phase: "Ф2",
  },
  {
    href: "/dengi",
    label: "Деньги",
    role: "turquoise",
    summary: "Счета, операции, правила, бюджеты, цели и аналитика по срезам",
    phase: "Ф1",
  },
  {
    href: "/telo",
    label: "Тело",
    role: "pomegranate",
    summary: "Блоки тренировок, привычки, замеры и план питания",
    phase: "Ф3",
  },
  {
    href: "/vremya",
    label: "Время",
    role: "ochre",
    summary: "Календарь с перетаскиванием, задачи и общая лента дедлайнов",
    phase: "Ф5",
  },
  {
    href: "/znanie",
    label: "Знание",
    role: "lapis",
    summary: "Университет, навыки, курсы, книги и архив пройденного",
    phase: "Ф7",
  },
  {
    href: "/delo",
    label: "Дело",
    role: "lapis",
    summary: "Бизнесы с метриками и воронка идей с оценкой по семи критериям",
    phase: "Ф6",
  },
  {
    href: "/mir",
    label: "Мир",
    role: "turquoise",
    summary: "Коллекции, путешествия и радар по Ташкенту под твои интересы",
    phase: "Ф8",
  },
  {
    href: "/itogi",
    label: "Итоги",
    role: "muted",
    summary: "Недельный и месячный разбор: что сошлось, а что нет",
    phase: "Ф9",
  },
  {
    href: "/nastrojki",
    label: "Настройки",
    role: "muted",
    summary: "Валюта, курс, часовой пояс, подушка, тема и выгрузка данных",
    phase: "Ф0",
  },
];

export function findNav(href: Route): NavItem | undefined {
  return NAV.find((item) => item.href === href);
}
