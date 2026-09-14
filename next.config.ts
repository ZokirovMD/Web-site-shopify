import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

/**
 * Плагину нужно показать, где лежит конфигурация запроса: путь не по умолчанию,
 * потому что маршрутов с языком в адресе у нас нет (см. i18n/request.ts).
 */
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const config: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
};

export default withNextIntl(config);
