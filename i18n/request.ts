import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, TIME_ZONE, isLocale } from "./config";

/**
 * Конфигурация next-intl на каждый запрос.
 *
 * Маршрутов с языком в адресе нет: ORBIT — личная система одного человека,
 * и /ru/dengi вместо /dengi ничего не даёт, зато ломает все ссылки при
 * добавлении второго языка. Локаль приходит из запроса (позже — из настроек
 * владельца), адрес остаётся прежним.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  return {
    locale,
    timeZone: TIME_ZONE,
    messages: (await import(`./messages/${locale}.json`)).default,
    formats: {
      dateTime: {
        /** «14 сентября» — подпись под числом на ПУЛЬСЕ. */
        day: { day: "numeric", month: "long" },
        /** «воскресенье, 14 сентября» — шапка дня. */
        weekday: { weekday: "long", day: "numeric", month: "long" },
        short: { day: "2-digit", month: "2-digit", year: "numeric" },
      },
    },
  };
});
