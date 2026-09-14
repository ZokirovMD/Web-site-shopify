import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * ORBIT — защита маршрутов.
 *
 * Middleware делает ТОЛЬКО дешёвую проверку: есть кука или нет. Настоящая
 * проверка сессии живёт в app/(app)/layout.tsx, где есть доступ к базе.
 *
 * Так намеренно: middleware работает на edge, там нет ни драйвера Neon,
 * ни argon2. Попытка проверить сессию здесь закончилась бы либо тяжёлым
 * запросом на каждый файл, либо самодельной криптографией в токене.
 */

/**
 * Открыто без сессии. Экран входа — очевидно; остальное — обвязка PWA:
 * service worker, которому редирект на /vhod ломает регистрацию, и страница
 * обрыва связи, которую он держит у себя. Личных данных там нет.
 */
const PUBLIC_PATHS = ["/vhod", "/offline", "/sw.js"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = request.cookies.has(SESSION_COOKIE);
  const isAuthRoute = pathname.startsWith("/vhod");

  if (!hasCookie && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/vhod", request.url));
  }

  if (hasCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Статика мимо: сборочные файлы, изображения, иконки и манифест. Иначе
   * приложение, установленное на домашний экран, не получит ни значка,
   * ни манифеста, пока не войдёшь.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webmanifest)$).*)",
  ],
};
