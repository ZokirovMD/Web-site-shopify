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
export function middleware(request: NextRequest) {
  const hasCookie = request.cookies.has(SESSION_COOKIE);
  const isAuthRoute = request.nextUrl.pathname.startsWith("/vhod");

  if (!hasCookie && !isAuthRoute) {
    const url = new URL("/vhod", request.url);
    return NextResponse.redirect(url);
  }

  if (hasCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.png$).*)"],
};
