import type { MetadataRoute } from "next";
import { getLocale, getTranslations } from "next-intl/server";

/**
 * Манифест приложения.
 *
 * Владелец живёт на виджетах, а не на иконках приложений. Виджет с домашнего
 * экрана веб приложению не отдают никому, и обещать его нечестно. Что можно
 * сделать по-настоящему: поставить ORBIT на домашний экран отдельным окном
 * без адресной строки, а долгое нажатие по значку превратить в быстрые входы
 * в модули — это ближайшее к виджету, что вообще существует в вебе.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);

  return {
    id: "/",
    name: t("brand.name"),
    short_name: t("brand.name"),
    description: t("brand.tagline"),
    lang: locale,
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    /** Цвета из брендбука: манганец под приложением, он же за строкой статуса. */
    background_color: "#17131C",
    theme_color: "#17131C",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: t("modules.dengi.label"),
        url: "/dengi",
        description: t("modules.dengi.hint"),
      },
      {
        name: t("modules.kontur.label"),
        url: "/kontur",
        description: t("modules.kontur.hint"),
      },
      {
        name: t("modules.telo.label"),
        url: "/telo",
        description: t("modules.telo.hint"),
      },
    ],
  };
}
