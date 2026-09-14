"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "./nav";
import { OrbitMark } from "./OrbitMark";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./TopStrap.module.css";

/**
 * Верхняя тесьма — оболочка ORBIT.
 *
 * Не боковая панель: сайдбар с закруглёнными карточками это ровно тот канон,
 * от которого мы отказались. Тесьма идёт поперёк страницы, как strapwork
 * в гирихе, и навигация висит на ней узлами.
 */
export function TopStrap({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = usePathname();

  return (
    <header className={styles.strap}>
      <div className={styles.row}>
        <Link href="/" className={styles.brand} aria-label="ORBIT, на главную">
          <OrbitMark size={26} />
          <span className={styles.brandName}>ORBIT</span>
        </Link>

        <nav className={styles.nav} aria-label="Модули">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navItem}
                data-active={active}
                data-role={item.role}
                aria-current={active ? "page" : undefined}
              >
                <span className={styles.navNode} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.palette}
            onClick={onOpenPalette}
            aria-label="Открыть поиск и быстрый ввод"
          >
            <span className={styles.paletteLabel}>Поиск</span>
            <kbd className={styles.kbd}>⌘K</kbd>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
