import { polygon, star10, toPath } from "./girih";

/**
 * Розетка гириха в полную силу.
 *
 * Пустые состояния — одно из трёх мест, где узор звучит громко (брендбук §2).
 * Здесь это уместно: данных нет, загораживать нечего, и экран не должен
 * выглядеть сломанным.
 *
 * Строится тем же генератором, что и фон: одна геометрия на всю систему.
 */
export function GirihEmpty({ size = 168 }: { size?: number }) {
  const c = size / 2;
  const r = size * 0.46;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden="true"
      style={{ flex: "0 0 auto" }}
    >
      <path d={toPath(star10(c, c, r))} stroke="var(--line-strong)" strokeWidth="1" />
      <path d={toPath(polygon(c, c, r * 0.62, 10))} stroke="var(--line)" strokeWidth="1" />
      <path d={toPath(polygon(c, c, r * 0.38, 10))} stroke="var(--lapis)" strokeWidth="1" />
      <path d={toPath(star10(c, c, r * 0.22))} stroke="var(--ochre)" strokeWidth="1" />
      <circle cx={c} cy={c} r={2} fill="var(--turquoise)" />
    </svg>
  );
}
