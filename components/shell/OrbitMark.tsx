/** Знак ORBIT: декагон-узел, через который проходит орбитальная тесьма. */
export function OrbitMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 3 L30.1 8.2 L36.2 17.5 L34.1 28.4 L25.6 35.5 L14.4 35.5 L5.9 28.4 L3.8 17.5 L9.9 8.2 Z"
        stroke="var(--lapis)"
        strokeWidth="1.4"
      />
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
