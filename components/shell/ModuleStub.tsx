import { useTranslations } from "next-intl";
import { Tile } from "@/design/primitives";
import { GirihEmpty } from "@/design/GirihEmpty";
import { findModule, type ModuleKey } from "./nav";
import styles from "./ModuleStub.module.css";

/**
 * Пустое состояние модуля.
 *
 * По брендбуку пустое состояние — одно из трёх мест, где узор гириха звучит
 * в полную силу. И оно объясняет СМЫСЛ модуля, а не констатирует пустоту:
 * «Нет данных» не говорит человеку ничего.
 *
 * Текст берётся из словаря по ключу модуля, фаза — из NAV. Страница модуля
 * передаёт только ключ: два источника правды на одну и ту же подпись однажды
 * разойдутся.
 */
export function ModuleStub({ module }: { module: ModuleKey }) {
  const t = useTranslations();
  const { phase } = findModule(module);

  /**
   * Списки в ICU не поддерживаются: `t` умеет только строки, а тут массив.
   * `raw` отдаёт значение как есть, типа у него нет — отсюда единственное
   * приведение в файле.
   */
  const points = t.raw(`modules.${module}.points`) as readonly string[];

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <p className="o-label">{t("common.phase", { n: phase })}</p>
          <h1 className={styles.title}>{t(`modules.${module}.label`)}</h1>
        </div>
        <GirihEmpty />
      </div>

      <p className={styles.summary}>{t(`modules.${module}.summary`)}</p>

      <Tile className={styles.tile}>
        <p className="o-label">{t("stub.whatWillBe")}</p>
        <ul className={styles.list}>
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </Tile>

      <p className={styles.note}>{t("stub.note")}</p>
    </div>
  );
}
