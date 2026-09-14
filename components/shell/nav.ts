/**
 * ORBIT — карта навигации.
 *
 * Восемь групп из docs/SYSTEM.md §2. Один источник правды: из него строится
 * и верхняя тесьма, и палитра ⌘K, и пустые состояния модулей. Дублировать
 * список в двух местах — гарантия того, что однажды они разойдутся.
 *
 * Названий здесь нет намеренно: они живут в i18n/messages под ключом
 * `modules.<key>`. Тут — только структура: адрес, цвет, фаза.
 */

import type { Route } from "next";

export const MODULE_KEYS = [
  "pulse",
  "kontur",
  "dengi",
  "telo",
  "vremya",
  "znanie",
  "delo",
  "mir",
  "itogi",
  "nastrojki",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export interface NavItem {
  /** Ключ в словаре: `modules.<key>.label`, `.hint`, `.summary`, `.points`. */
  key: ModuleKey;
  /** Типизированный маршрут: typedRoutes ловит опечатку в ссылке на этапе сборки. */
  href: Route;
  /** Роль цвета из брендбука. Цвет владеет областью, а не рассыпан точками. */
  role: "lapis" | "turquoise" | "ochre" | "pomegranate" | "muted";
  /** Номер фазы из docs/SYSTEM.md §10. Подпись собирается в словаре: «Ф{n}». */
  phase: number;
}

export const NAV: readonly NavItem[] = [
  { key: "pulse", href: "/", role: "lapis", phase: 1 },
  { key: "kontur", href: "/kontur", role: "turquoise", phase: 2 },
  { key: "dengi", href: "/dengi", role: "turquoise", phase: 1 },
  { key: "telo", href: "/telo", role: "pomegranate", phase: 3 },
  { key: "vremya", href: "/vremya", role: "ochre", phase: 5 },
  { key: "znanie", href: "/znanie", role: "lapis", phase: 7 },
  { key: "delo", href: "/delo", role: "lapis", phase: 6 },
  { key: "mir", href: "/mir", role: "turquoise", phase: 8 },
  { key: "itogi", href: "/itogi", role: "muted", phase: 9 },
  { key: "nastrojki", href: "/nastrojki", role: "muted", phase: 0 },
];

export function findNav(href: Route): NavItem | undefined {
  return NAV.find((item) => item.href === href);
}

export function findModule(key: ModuleKey): NavItem {
  const item = NAV.find((navItem) => navItem.key === key);
  // Ключи — литеральный union из MODULE_KEYS, так что промах означает, что
  // кто-то разошёлся с NAV. Лучше упасть сразу, чем рисовать пустую страницу.
  if (!item) throw new Error(`Модуль «${key}» отсутствует в NAV`);
  return item;
}
