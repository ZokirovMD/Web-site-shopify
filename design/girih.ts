/**
 * ORBIT — генератор гириха.
 *
 * Гирих — система из пяти плиток, которой в XIV–XV веках собирали узоры Самарканда.
 * Все пять имеют ОДНУ длину ребра, все углы кратны 36°. Отсюда вся геометрия ниже:
 * единственная константа — длина ребра, всё остальное выводится из неё и из шага в 36°.
 *
 * Чистый модуль: не знает ни о React, ни о DOM. Отдаёт координаты и пути,
 * рисовать ими можно и в canvas, и в SVG.
 *
 * Дисциплина (docs/BRANDBOOK.md §2): узор живёт только в трёх местах —
 * фон страницы до 4% непрозрачности, пустые состояния, экран входа.
 * Под данными узора нет никогда.
 */

/** Шаг гириха: 36° в радианах. Все углы системы кратны ему. */
export const GIRIH_STEP = Math.PI / 5;

/** Золотое сечение — отношение диагонали пентагона к стороне.
 *  Та же константа держит шкалу типографики. */
export const PHI = (1 + Math.sqrt(5)) / 2;

export interface Point {
  x: number;
  y: number;
}

/** Правильный многоугольник с `sides` сторонами. */
export function polygon(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation = -Math.PI / 2,
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }
  return points;
}

/**
 * Десятиконечная звезда — центральная розетка гириха.
 * Внешние вершины через 36°, внутренние смещены на 18° и лежат на radius / φ.
 */
export function star10(
  cx: number,
  cy: number,
  radius: number,
  rotation = -Math.PI / 2,
): Point[] {
  const inner = radius / PHI;
  const points: Point[] = [];
  for (let i = 0; i < 10; i += 1) {
    const outerAngle = rotation + i * GIRIH_STEP;
    const innerAngle = outerAngle + GIRIH_STEP / 2;
    points.push({
      x: cx + Math.cos(outerAngle) * radius,
      y: cy + Math.sin(outerAngle) * radius,
    });
    points.push({
      x: cx + Math.cos(innerAngle) * inner,
      y: cy + Math.sin(innerAngle) * inner,
    });
  }
  return points;
}

/** Замкнутый SVG-путь по точкам. */
export function toPath(points: Point[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points as [Point, ...Point[]];
  const body = rest.map((p) => `L${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("");
  return `M${first.x.toFixed(2)} ${first.y.toFixed(2)}${body}Z`;
}

export interface TessellationOptions {
  width: number;
  height: number;
  /** Шаг решётки. Определяет масштаб узора. */
  cell?: number;
}

/**
 * Тесселяция: розетки на решётке со сдвигом через ряд, соединённые тесьмой.
 * Возвращает массив SVG-путей — вызывающий решает, чем и с какой прозрачностью рисовать.
 */
export function tessellation({
  width,
  height,
  cell = 132,
}: TessellationOptions): string[] {
  const paths: string[] = [];
  const radius = cell * 0.46;
  const rowHeight = cell * 0.866;

  for (let row = -1; row * rowHeight < height + cell; row += 1) {
    const cy = row * rowHeight;
    const offsetX = row % 2 === 0 ? 0 : cell / 2;

    for (let col = -1; col * cell + offsetX < width + cell; col += 1) {
      const cx = col * cell + offsetX;

      paths.push(toPath(star10(cx, cy, radius)));
      paths.push(toPath(polygon(cx, cy, radius * 0.4, 10)));
      // тесьма к соседу справа
      paths.push(
        `M${(cx + radius).toFixed(2)} ${cy.toFixed(2)}L${(cx + cell - radius).toFixed(2)} ${cy.toFixed(2)}`,
      );
    }
  }

  return paths;
}

/**
 * Фаска — срезанный угол вместо скругления.
 * Срезаны верхний левый и нижний правый: направление, а не симметрия.
 */
export function chamferPath(size = 10): string {
  return [
    `polygon(`,
    `${size}px 0,`,
    `100% 0,`,
    `100% calc(100% - ${size}px),`,
    `calc(100% - ${size}px) 100%,`,
    `0 100%,`,
    `0 ${size}px`,
    `)`,
  ].join("");
}
