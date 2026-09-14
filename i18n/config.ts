/**
 * ORBIT — язык и время.
 *
 * Локаль одна: русский. Но проходит она через next-intl, а не через прямой
 * импорт json, по трём причинам, каждая из которых уже кусается сегодня:
 *
 * 1. Множественное число. «+1 дней» — это брак. ICU знает русские формы
 *    one/few/many и выбирает их сам.
 * 2. Часовой пояс. Сервер на Vercel живёт в UTC, владелец — в Ташкенте.
 *    Без явного пояса дата на сервере и дата в браузере расходятся на пять
 *    часов, и React ругается на рассинхрон разметки.
 * 3. Горизонт 30–40 лет. Второй язык однажды понадобится, и тогда его
 *    добавляют файлом, а не переписыванием каждого компонента.
 */

export const LOCALES = ["ru"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";

/**
 * Пока константа. В Ф1 переедет в настройки: таблица `settings` уже хранит
 * пояс, а этот модуль станет местом, где он читается из базы.
 */
export const TIME_ZONE = "Asia/Tashkent";

/**
 * Именованные форматы даты — общие для сервера и клиента.
 *
 * Живут здесь, а не в `request.ts`, потому что их нужно ОТДЕЛЬНО передать
 * в `NextIntlClientProvider`: серверная конфигурация до клиентских компонентов
 * сама не доезжает, и `formatter.dateTime(date, "weekday")` в клиентском
 * компоненте падает с MISSING_FORMAT. Это видно только в браузере — сборка
 * и типы молчат.
 */
export const FORMATS = {
  dateTime: {
    /** «14 сентября» — подпись под числом. */
    day: { day: "numeric", month: "long" },
    /** «понедельник, 14 сентября» — шапка дня. */
    weekday: { weekday: "long", day: "numeric", month: "long" },
    short: { day: "2-digit", month: "2-digit", year: "numeric" },
  },
} as const;

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value);
}
