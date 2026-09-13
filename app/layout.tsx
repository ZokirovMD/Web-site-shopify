import type { Metadata, Viewport } from "next";
import { Golos_Text, Martian_Mono, Unbounded } from "next/font/google";
import ru from "@/i18n/ru.json";
import "./globals.css";

/**
 * Гарнитуры выбраны под жёсткое ограничение: настоящая кириллица и табличные цифры.
 * Inter, DM Sans, Space Grotesk, Plus Jakarta Sans запрещены намеренно — по ним
 * интерфейс опознаётся как сгенерированный. См. docs/BRANDBOOK.md §4.
 */
const unbounded = Unbounded({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-loaded",
  display: "swap",
});

const golos = Golos_Text({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-text-loaded",
  display: "swap",
});

const martian = Martian_Mono({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500"],
  variable: "--font-mono-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: ru.brand.name,
  description: ru.brand.tagline,
  applicationName: ru.brand.name,
  appleWebApp: { capable: true, title: ru.brand.name, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#17131C" },
    { media: "(prefers-color-scheme: light)", color: "#F2EBDD" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${golos.variable} ${martian.variable}`}>
      <body>{children}</body>
    </html>
  );
}
