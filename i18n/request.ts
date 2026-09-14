import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, FORMATS, TIME_ZONE, isLocale } from "./config";

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
    formats: FORMATS,
  };
});
