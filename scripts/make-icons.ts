/**
 * ORBIT — сборка иконок приложения.
 *
 * Знак рисуется кодом, а не вручную в редакторе: та же геометрия, что у
 * OrbitMark, те же цвета из брендбука. Меняется знак — иконки пересобираются
 * одной командой и не расходятся с интерфейсом.
 *
 *   node --experimental-strip-types scripts/make-icons.ts
 *
 * PNG рендерит Chromium: он уже стоит в контейнере (см. PLAYWRIGHT_BROWSERS_PATH),
 * отдельная графическая библиотека ради четырёх файлов не нужна.
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { polygon, toPath } from "../design/girih.ts";

/**
 * В контейнере лежит предустановленный Chromium, и его ревизия не совпадает
 * с той, которую ждёт свежий playwright. Скачивать вторую копию незачем —
 * указываем путь напрямую, если он есть.
 */
const PREINSTALLED = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** Цвета — литералы из docs/BRANDBOOK.md §3. Файл вне React, токенов тут нет. */
const GROUND = "#17131C";
const INK = "#EDE6D8";
const LAPIS = "#6486F5";
const OCHRE = "#D9A441";

/** Тот же декагон, что в components/shell/OrbitMark — из общего генератора. */
const NODE = toPath(polygon(20, 20, 17, 10));

/**
 * Знак в квадрате `box`, вписанный так, чтобы занимать `span` пикселей.
 * Исходная геометрия — 40×40, как в components/shell/OrbitMark.
 */
function mark(box: number, span: number, ground: boolean): string {
  const scale = span / 40;
  const offset = (box - span) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">
  ${ground ? `<rect width="${box}" height="${box}" fill="${GROUND}"/>` : ""}
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none">
    <path d="${NODE}" stroke="${LAPIS}" stroke-width="1.4"/>
    <ellipse cx="20" cy="20" rx="18" ry="7.2" stroke="${OCHRE}"
             stroke-width="1.4" transform="rotate(-36 20 20)"/>
    <circle cx="20" cy="20" r="2.2" fill="${INK}"/>
  </g>
</svg>`;
}

/**
 * Маскируемая иконка: Android обрезает её по своей форме и гарантирует
 * невредимыми только 80% диаметра. Поэтому знак здесь мельче.
 */
const FILES = [
  { name: "icon-192.png", box: 192, span: 165 },
  { name: "icon-512.png", box: 512, span: 440 },
  { name: "icon-maskable-512.png", box: 512, span: 340 },
  { name: "apple-icon.png", box: 180, span: 150 },
] as const;

async function main(): Promise<void> {
  await mkdir("public", { recursive: true });
  await writeFile("public/icon.svg", `${mark(512, 440, true)}\n`, "utf8");

  const browser = await chromium.launch(
    existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {},
  );
  const page = await browser.newPage();

  for (const file of FILES) {
    const svg = mark(file.box, file.span, true);
    await page.setViewportSize({ width: file.box, height: file.box });
    await page.setContent(
      `<style>html,body{margin:0;padding:0;background:${GROUND}}</style>${svg}`,
    );
    await page.screenshot({ path: `public/${file.name}`, omitBackground: false });
    console.log(`public/${file.name} — ${file.box}×${file.box}`);
  }

  await browser.close();
  console.log("public/icon.svg — 512×512");
}

await main();
