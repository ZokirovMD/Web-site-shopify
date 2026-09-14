import { Tile } from "@/design/primitives";
import { GirihEmpty } from "@/design/GirihEmpty";
import styles from "./ModuleStub.module.css";

/**
 * Пустое состояние модуля.
 *
 * По брендбуку пустое состояние — одно из трёх мест, где узор гириха звучит
 * в полную силу. И оно объясняет СМЫСЛ модуля, а не констатирует пустоту:
 * «Нет данных» не говорит человеку ничего.
 */
export function ModuleStub({
  title,
  summary,
  phase,
  points,
}: {
  title: string;
  summary: string;
  phase: string;
  points: readonly string[];
}) {
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <p className="o-label">{phase}</p>
          <h1 className={styles.title}>{title}</h1>
        </div>
        <GirihEmpty />
      </div>

      <p className={styles.summary}>{summary}</p>

      <Tile className={styles.tile}>
        <p className="o-label">Что здесь будет</p>
        <ul className={styles.list}>
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </Tile>

      <p className={styles.note}>
        Модуль ещё не собран. Ядро под него уже написано и покрыто тестами —
        интерфейс поверх него будет тонким.
      </p>
    </div>
  );
}
