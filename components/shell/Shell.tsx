"use client";

import { useCallback, useEffect, useState } from "react";
import { GirihGround } from "@/design/GirihGround";
import { CommandPalette } from "./CommandPalette";
import { TopStrap } from "./TopStrap";

/** Оболочка ORBIT: фон-гирих, верхняя тесьма, палитра ⌘K. */
export function Shell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  const open = useCallback(() => setPaletteOpen(true), []);
  const close = useCallback(() => setPaletteOpen(false), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <GirihGround />
      <TopStrap onOpenPalette={open} />
      <main>{children}</main>
      <CommandPalette open={paletteOpen} onClose={close} />
    </>
  );
}
