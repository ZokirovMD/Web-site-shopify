import { polygon, toPath } from "@/design/girih";

/**
 * Знак ORBIT: узел-декагон, через который проходит орбитальная тесьма.
 *
 * Декагон именно генератором, а не путём из редактора: гирих — система с
 * пятикратной симметрией, все углы кратны 36°. Нарисованный на глаз девятигранник
 * даёт 40° и ломает грамматику ровно в том месте, где она заявлена.
 *
 * Эллипс повёрнут на −36° — тот же шаг системы.
 */
const NODE = toPath(polygon(20, 20, 17, 10));

export function OrbitMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d={NODE} stroke="var(--lapis)" strokeWidth="1.4" />
      <ellipse
        cx="20"
        cy="20"
        rx="18"
        ry="7.2"
        stroke="var(--ochre)"
        strokeWidth="1.4"
        transform="rotate(-36 20 20)"
      />
      <circle cx="20" cy="20" r="2.2" fill="var(--ink)" />
    </svg>
  );
}
