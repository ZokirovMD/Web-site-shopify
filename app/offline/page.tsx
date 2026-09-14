import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GirihEmpty } from "@/design/GirihEmpty";
import { GirihGround } from "@/design/GirihGround";
import styles from "./page.module.css";

/**
 * Страница на случай обрыва связи.
 *
 * Единственная страница, которую service worker кладёт к себе: она статическая
 * и не содержит ни строчки личных данных. Всё остальное приложение офлайн
 * не показывается намеренно — см. public/sw.js.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("common.pageTitle", { title: t("offline.title"), brand: t("brand.name") }),
  };
}

export default async function OfflinePage() {
  const t = await getTranslations("offline");

  return (
    <>
      <GirihGround cell={196} />
      <div className={styles.page}>
        <div className={styles.card}>
          <GirihEmpty size={140} />
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.body}>{t("body")}</p>
          {/* Обычная ссылка, а не Link: нужна именно полная перезагрузка.
              Клиентская навигация попросит у сервера RSC-поток, которого офлайн
              нет, и страница просто останется стоять. Правило отключено осознанно. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className={styles.retry} href="/">
            {t("retry")}
          </a>
        </div>
      </div>
    </>
  );
}
