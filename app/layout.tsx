import type { Metadata, Viewport } from "next";
import { Golos_Text, Martian_Mono, Unbounded } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { ServiceWorker } from "@/components/shell/ServiceWorker";
import { FORMATS, TIME_ZONE } from "@/i18n/config";
import "./globals.css";

/**
 * Гарнитуры выбраны под жёсткое ограничение: настоящая кириллица и табличные цифры.
 * Inter, DM Sans, Space Grotesk, Plus Jakarta Sans запрещены намеренно — по ним
 * интерфейс опознаётся как сгенерированный. См. docs/BRANDBOOK.md §4.
 */
const unbounded = Unbounded({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-loaded",
  display: "swap",
});

const golos = Golos_Text({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-text-loaded",
  display: "swap",
});

const martian = Martian_Mono({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500"],
  variable: "--font-mono-loaded",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("brand");
  const name = t("name");

  return {
    title: name,
    description: t("tagline"),
    applicationName: name,
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: name, statusBarStyle: "black-translucent" },
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#17131C" },
    { media: "(prefers-color-scheme: light)", color: "#F2EBDD" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /**
   * Сообщения уходят в провайдер целиком: словарь у нас маленький, а разбор
   * по namespace на каждый компонент даёт больше швов, чем экономии.
   */
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html
      lang={locale}
      className={`${unbounded.variable} ${golos.variable} ${martian.variable}`}
    >
      <body>
        {/* formats и timeZone передаются явно: серверная конфигурация сама
            до клиентских компонентов не доезжает, и `dateTime(date, "weekday")`
            там падает на отсутствующем формате. */}
        <NextIntlClientProvider
          messages={messages}
          formats={FORMATS}
          timeZone={TIME_ZONE}
        >
          {children}
          <ServiceWorker />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
