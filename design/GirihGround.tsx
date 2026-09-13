"use client";

import { useEffect, useRef } from "react";
import { tessellation } from "./girih";

/**
 * Фон страницы — настоящий гирих, построенный по углам 36°.
 *
 * Дисциплина брендбука: непрозрачность не выше 4%, и под данными этого фона нет.
 * Рисуется на canvas, а не четырьмя сотнями строк SVG-путей.
 */
export function GirihGround({ cell = 132 }: { cell?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const styles = getComputedStyle(document.documentElement);
      const alpha = Number.parseFloat(styles.getPropertyValue("--pattern-alpha")) || 0.035;
      const ink = styles.getPropertyValue("--ink").trim() || "#EDE6D8";

      ctx.strokeStyle = ink;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1;

      for (const path of tessellation({ width, height, cell })) {
        ctx.stroke(new Path2D(path));
      }
    };

    draw();

    const onResize = () => {
      window.clearTimeout(frame);
      frame = window.setTimeout(draw, 150);
    };

    window.addEventListener("resize", onResize);

    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", draw);

    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.clearTimeout(frame);
      window.removeEventListener("resize", onResize);
      scheme.removeEventListener("change", draw);
      observer.disconnect();
    };
  }, [cell]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
