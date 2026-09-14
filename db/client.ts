/**
 * ORBIT — подключение к Neon.
 *
 * Serverless-драйвер по HTTP: на Vercel нет долгоживущего процесса,
 * и обычный пул соединений там только мешает.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL не задан. Создай проект на neon.tech и добавь строку подключения " +
        "в переменные окружения Vercel и в .env.local.",
    );
  }
  return url;
}

export const db = drizzle(neon(connectionString()), { schema });
export { schema };
