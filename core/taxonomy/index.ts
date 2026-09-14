/**
 * ORBIT — таксономия.
 *
 * Трата — это не одно поле «категория». Это четыре независимых измерения:
 *
 *   ЧТО   — категория: еда, транспорт, учёба…
 *   С КЕМ — контекст: один, семья, друзья, университет…
 *   ЗАЧЕМ — повод: необходимость, вложение, удовольствие, импульс…
 *   ГДЕ   — место (необязательно)
 *
 * Смысл в том, что вопросы вроде «сколько ушло на еду с друзьями за полгода»
 * или «сколько я потратил импульсивно» становятся обычным запросом, а не
 * археологией по заметкам. Одно поле «категория» на такой вопрос не отвечает.
 *
 * События календаря размечаются теми же контекстами — тогда «сколько встреч
 * с друзьями было за полгода» считается тем же механизмом, что и траты.
 *
 * Чистый модуль. Это данные по умолчанию: владелец правит, добавляет и удаляет
 * что угодно, а система лишь стартует не с пустого листа.
 */

export type ColorRole = "lapis" | "turquoise" | "ochre" | "pomegranate" | "ink" | "muted";

export interface CategoryNode {
  id: string;
  name: string;
  children?: readonly CategoryNode[];
  colorRole?: ColorRole;
}

/* ============================================================================
   РАСХОДЫ
   ============================================================================ */

export const EXPENSE_CATEGORIES: readonly CategoryNode[] = [
  {
    id: "food",
    name: "Еда",
    colorRole: "ochre",
    children: [
      { id: "food.groceries", name: "Продукты" },
      { id: "food.cafe", name: "Кафе и рестораны" },
      { id: "food.delivery", name: "Доставка" },
      { id: "food.coffee", name: "Кофе" },
      { id: "food.snacks", name: "Перекусы" },
    ],
  },
  {
    id: "transport",
    name: "Транспорт",
    colorRole: "muted",
    children: [
      { id: "transport.taxi", name: "Такси" },
      { id: "transport.public", name: "Метро и автобус" },
      { id: "transport.fuel", name: "Бензин" },
      { id: "transport.repair", name: "Ремонт и обслуживание" },
    ],
  },
  {
    id: "home",
    name: "Жильё",
    colorRole: "muted",
    children: [
      { id: "home.rent", name: "Аренда" },
      { id: "home.utilities", name: "Коммуналка" },
      { id: "home.internet", name: "Интернет" },
      { id: "home.stuff", name: "Ремонт и мебель" },
    ],
  },
  {
    id: "study",
    name: "Учёба",
    colorRole: "lapis",
    children: [
      { id: "study.tuition", name: "Контракт" },
      { id: "study.books", name: "Учебники и материалы" },
      { id: "study.courses", name: "Онлайн-курсы" },
      { id: "study.tutor", name: "Репетитор" },
    ],
  },
  {
    id: "health",
    name: "Здоровье",
    colorRole: "turquoise",
    children: [
      { id: "health.gym", name: "Зал и спорт" },
      { id: "health.doctor", name: "Врач и анализы" },
      { id: "health.meds", name: "Лекарства" },
      { id: "health.supplements", name: "Спортпит" },
    ],
  },
  {
    id: "look",
    name: "Внешний вид",
    colorRole: "muted",
    children: [
      { id: "look.clothes", name: "Одежда и обувь" },
      { id: "look.barber", name: "Барбер" },
      { id: "look.care", name: "Уход" },
    ],
  },
  {
    id: "subs",
    name: "Связь и подписки",
    colorRole: "pomegranate",
    children: [
      { id: "subs.mobile", name: "Мобильная связь" },
      { id: "subs.services", name: "Сервисы и подписки" },
      { id: "subs.hosting", name: "Хостинг и домены" },
    ],
  },
  {
    id: "tech",
    name: "Техника",
    colorRole: "lapis",
    children: [
      { id: "tech.devices", name: "Устройства" },
      { id: "tech.accessories", name: "Аксессуары" },
      { id: "tech.software", name: "Софт" },
    ],
  },
  {
    id: "people",
    name: "Люди",
    colorRole: "ochre",
    children: [
      { id: "people.gifts", name: "Подарки" },
      { id: "people.help", name: "Помощь близким" },
      { id: "people.shared", name: "Совместные расходы" },
      { id: "people.events", name: "Свадьбы и тои" },
    ],
  },
  {
    id: "leisure",
    name: "Отдых",
    colorRole: "turquoise",
    children: [
      { id: "leisure.culture", name: "Кино, концерты, музеи" },
      { id: "leisure.travel", name: "Путешествия" },
      { id: "leisure.hobby", name: "Хобби" },
      { id: "leisure.games", name: "Игры" },
    ],
  },
  {
    id: "business",
    name: "Бизнес",
    colorRole: "lapis",
    children: [
      { id: "business.ads", name: "Реклама" },
      { id: "business.goods", name: "Товар и закупка" },
      { id: "business.services", name: "Сервисы и инструменты" },
      { id: "business.contractors", name: "Подрядчики" },
    ],
  },
  {
    id: "other",
    name: "Прочее",
    colorRole: "muted",
    children: [
      { id: "other.fees", name: "Комиссии" },
      { id: "other.fines", name: "Штрафы" },
      { id: "other.unexpected", name: "Непредвиденное" },
    ],
  },
];

/* ============================================================================
   ДОХОДЫ
   ============================================================================ */

export const INCOME_CATEGORIES: readonly CategoryNode[] = [
  { id: "income.stipend", name: "Стипендия", colorRole: "turquoise" },
  { id: "income.salary", name: "Зарплата", colorRole: "turquoise" },
  { id: "income.business", name: "Бизнес", colorRole: "turquoise" },
  { id: "income.freelance", name: "Фриланс", colorRole: "turquoise" },
  { id: "income.gift", name: "Подарок или помощь", colorRole: "ochre" },
  { id: "income.debt", name: "Возврат долга", colorRole: "muted" },
  { id: "income.sale", name: "Продажа вещей", colorRole: "muted" },
];

/* ============================================================================
   С КЕМ — контекст.
   Размечает и траты, и события календаря: тогда «сколько встреч с друзьями
   за полгода» и «сколько на них ушло» считаются одним механизмом.
   ============================================================================ */

export interface ContextNode {
  id: string;
  name: string;
  colorRole: ColorRole;
}

export const CONTEXTS: readonly ContextNode[] = [
  { id: "alone", name: "Один", colorRole: "muted" },
  { id: "family", name: "Семья", colorRole: "ochre" },
  { id: "friends", name: "Друзья", colorRole: "turquoise" },
  { id: "partner", name: "Пара", colorRole: "pomegranate" },
  { id: "university", name: "Университет", colorRole: "lapis" },
  { id: "business", name: "Бизнес и партнёры", colorRole: "lapis" },
  { id: "public", name: "Публично и незнакомые", colorRole: "muted" },
];

/* ============================================================================
   ЗАЧЕМ — повод.
   Самое неудобное и самое полезное измерение: месячный итог по «импульсу»
   меняет поведение сильнее, чем любой запрет.
   ============================================================================ */

export interface MotiveNode {
  id: string;
  name: string;
  hint: string;
  colorRole: ColorRole;
}

export const MOTIVES: readonly MotiveNode[] = [
  {
    id: "need",
    name: "Необходимость",
    hint: "Без этого никак: еда, проезд, аренда",
    colorRole: "muted",
  },
  {
    id: "planned",
    name: "Плановое",
    hint: "Знал заранее и заложил",
    colorRole: "lapis",
  },
  {
    id: "invest",
    name: "Вложение в себя",
    hint: "Учёба, здоровье, инструмент для работы",
    colorRole: "turquoise",
  },
  {
    id: "joy",
    name: "Удовольствие",
    hint: "Осознанно и не жалею",
    colorRole: "ochre",
  },
  {
    id: "duty",
    name: "Обязательство",
    hint: "Не мог отказаться: той, подарок, сбор",
    colorRole: "ochre",
  },
  {
    id: "impulse",
    name: "Импульс",
    hint: "Купил не подумав",
    colorRole: "pomegranate",
  },
];

/* ============================================================================
   СОБЫТИЯ КАЛЕНДАРЯ
   ============================================================================ */

export const EVENT_CATEGORIES: readonly CategoryNode[] = [
  {
    id: "ev.study",
    name: "Учёба",
    colorRole: "lapis",
    children: [
      { id: "ev.study.class", name: "Пара" },
      { id: "ev.study.exam", name: "Экзамен" },
      { id: "ev.study.deadline", name: "Дедлайн" },
    ],
  },
  {
    id: "ev.meeting",
    name: "Встреча",
    colorRole: "ochre",
    children: [
      { id: "ev.meeting.friends", name: "С друзьями" },
      { id: "ev.meeting.family", name: "С семьёй" },
      { id: "ev.meeting.business", name: "Деловая" },
      { id: "ev.meeting.call", name: "Созвон" },
    ],
  },
  { id: "ev.training", name: "Тренировка", colorRole: "turquoise" },
  { id: "ev.learning", name: "Обучение", colorRole: "lapis" },
  { id: "ev.work", name: "Работа и дело", colorRole: "lapis" },
  { id: "ev.personal", name: "Личное", colorRole: "muted" },
  { id: "ev.trip", name: "Поездка", colorRole: "turquoise" },
  { id: "ev.health", name: "Здоровье", colorRole: "pomegranate" },
  { id: "ev.rest", name: "Отдых", colorRole: "ochre" },
];

/* ============================================================================
   Утилиты
   ============================================================================ */

/** Плоский список всех узлов дерева, включая родителей. */
export function flatten(nodes: readonly CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  for (const node of nodes) {
    out.push(node);
    if (node.children) out.push(...flatten(node.children));
  }
  return out;
}

/** Поиск узла по идентификатору в любом дереве. */
export function findCategory(
  nodes: readonly CategoryNode[],
  id: string,
): CategoryNode | undefined {
  return flatten(nodes).find((node) => node.id === id);
}

/**
 * Корневая категория для листа: "food.cafe" → "food".
 * Нужна, чтобы сворачивать аналитику до верхнего уровня без отдельной таблицы.
 */
export function rootCategoryId(id: string): string {
  const dot = id.indexOf(".");
  if (dot === -1) return id;
  // доходы плоские и уже начинаются с "income."
  if (id.startsWith("income.")) return id;
  return id.slice(0, dot);
}

/** Путь от корня к узлу: ["Еда", "Кафе и рестораны"]. */
export function categoryPath(
  nodes: readonly CategoryNode[],
  id: string,
): string[] {
  for (const node of nodes) {
    if (node.id === id) return [node.name];
    if (node.children) {
      const deeper = categoryPath(node.children, id);
      if (deeper.length > 0) return [node.name, ...deeper];
    }
  }
  return [];
}
