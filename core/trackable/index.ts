/**
 * ORBIT — сквозное состояние.
 *
 * Владелец описал сценарий: я предлагаю курс → он принимает → ставит в календарь
 * на конкретные дни → смотрит → ставит галочку → и это закрывается ВЕЗДЕ,
 * а потом попадает в список того, чему он обучался.
 *
 * Ключевое решение: **одна строка правды и проекции в модули, а не копии.**
 * Событие календаря не копирует курс, а ссылается на него. Задача не копирует
 * домашку, а ссылается. Поэтому отметка в любом месте закрывает во всех:
 * менять нечего, состояние одно.
 *
 * Копии всегда расходятся. Через месяц в календаре «сделано», в списке курсов
 * «в процессе», и владелец перестаёт верить обоим.
 *
 * Тот же механизм обслуживает курсы, тренировки, домашки, задачи и встречи —
 * поэтому он в ядре, а не внутри модуля обучения.
 *
 * Чистый модуль.
 */

import { isAfter, type CalendarDate } from "@/core/date";

export type TrackableKind =
  | "learning" // курс, книга, ролик
  | "training" // сессия тренировки
  | "assignment" // домашка
  | "task" // задача
  | "meeting" // встреча
  | "habit"; // привычка

export type TrackableStatus =
  | "suggested" // я предложил, владелец ещё не решил
  | "accepted" // принято, но не запланировано
  | "planned" // стоит в календаре на конкретные дни
  | "doing" // начато
  | "done" // сделано
  | "dropped"; // отказался

export interface Trackable {
  id: string;
  kind: TrackableKind;
  title: string;
  status: TrackableStatus;
  /** Дни, на которые владелец это запланировал. */
  plannedFor: readonly CalendarDate[];
  completedOn?: CalendarDate | null;
  droppedReason?: string | null;
  /** Предложение, из которого это выросло. Пусто — завёл руками. */
  suggestionId?: string | null;
  /** Кто создал: владелец или я. */
  source: "manual" | "claude";
}

/**
 * Разрешённые переходы.
 *
 * Записаны явно, потому что «закрывается везде» ломается не там, где думают:
 * не в UI, а в состоянии, которое можно перевести куда попало из трёх разных мест.
 */
const TRANSITIONS: Record<TrackableStatus, readonly TrackableStatus[]> = {
  suggested: ["accepted", "dropped"],
  accepted: ["planned", "doing", "done", "dropped"],
  planned: ["doing", "done", "accepted", "dropped"],
  doing: ["done", "planned", "dropped"],
  // сделанное можно вернуть в работу — ошиблись галочкой, бывает
  done: ["doing"],
  dropped: ["accepted"],
};

export function canTransition(from: TrackableStatus, to: TrackableStatus): boolean {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
}

export class TransitionError extends Error {
  constructor(from: TrackableStatus, to: TrackableStatus) {
    super(`Нельзя перевести «${from}» → «${to}».`);
    this.name = "TransitionError";
  }
}

export interface TransitionOptions {
  on: CalendarDate;
  reason?: string;
}

/**
 * Перевод состояния. Возвращает НОВЫЙ объект — исходный не мутируется,
 * чтобы отменить действие можно было простой заменой.
 */
export function transition(
  item: Trackable,
  to: TrackableStatus,
  options: TransitionOptions,
): Trackable {
  if (!canTransition(item.status, to)) {
    throw new TransitionError(item.status, to);
  }

  const next: Trackable = { ...item, status: to };

  if (to === "done") {
    next.completedOn = options.on;
    next.droppedReason = null;
  } else if (to === "dropped") {
    next.droppedReason = options.reason ?? null;
    next.completedOn = null;
  } else {
    // Возврат в работу снимает и дату завершения, и причину отказа:
    // иначе архив соврёт, а в карточке останется висеть «дорого»
    // на вещи, которую владелец всё-таки взял.
    next.completedOn = null;
    next.droppedReason = null;
  }

  return next;
}

/** Отметить сделанным. Именно это вызывается из любого модуля. */
export function complete(item: Trackable, on: CalendarDate): Trackable {
  return transition(item, "done", { on });
}

export function isOpen(item: Trackable): boolean {
  return item.status !== "done" && item.status !== "dropped";
}

/**
 * Запланировать на дни. Автоматически переводит в «planned»,
 * если владелец ещё не начал: планирование и есть принятие в календарь.
 */
export function planOn(item: Trackable, dates: readonly CalendarDate[]): Trackable {
  const unique = [...new Set(dates)].sort();
  const shouldAdvance = item.status === "accepted" || item.status === "suggested";
  return {
    ...item,
    plannedFor: unique,
    status: shouldAdvance && unique.length > 0 ? "planned" : item.status,
  };
}

/**
 * Просрочено: запланировано на прошедший день и до сих пор открыто.
 * Это то, что подсвечивается охрой в ОБЯЗАТЕЛЬСТВАХ.
 */
export function isOverdue(item: Trackable, today: CalendarDate): boolean {
  if (!isOpen(item)) return false;
  if (item.plannedFor.length === 0) return false;
  const last = item.plannedFor[item.plannedFor.length - 1]!;
  return isAfter(today, last);
}

/** Что стоит на конкретный день — из этого собирается ПУЛЬС и календарь. */
export function scheduledOn(
  items: readonly Trackable[],
  date: CalendarDate,
): Trackable[] {
  return items.filter((item) => item.plannedFor.includes(date));
}

/**
 * Архив: всё завершённое за период, новое сверху.
 * Это и есть «весь список того, чему я обучался».
 */
export function archive(
  items: readonly Trackable[],
  options: { from: CalendarDate; to: CalendarDate; kind?: TrackableKind },
): Trackable[] {
  return items
    .filter((item) => {
      if (item.status !== "done" || !item.completedOn) return false;
      if (options.kind && item.kind !== options.kind) return false;
      return item.completedOn >= options.from && item.completedOn <= options.to;
    })
    .sort((a, b) => (a.completedOn! < b.completedOn! ? 1 : -1));
}
