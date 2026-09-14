/**
 * ORBIT — подключение к Neon.
 *
 * Serverless-драйвер по HTTP: на Vercel нет долгоживущего процесса,
 * и обычный пул соединений там только мешает.
 *
 * Подключение ЛЕНИВОЕ. Если создавать клиент на загрузке модуля, сборка
 * падает целиком, когда DATABASE_URL ещё не задан: Next исполняет модули
 * при пререндере, и отсутствие переменной ломает то, что к базе не ходит.
 * Так ошибка приходит на запрос, называет причину и чинится настройкой,
 * а не выглядит как сломанный билд.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = NeonHttpDatabase<typeof schema>;

let cached: Database | null = null;

function connect(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL не задан. На Vercel: Settings → Environment Variables, " +
        "либо подключи хранилище Neon к проекту — тогда переменная придёт сама. " +
        "Локально: .env.local в корне репозитория.",
    );
  }
  cached ??= drizzle(neon(url), { schema });
  return cached;
}

/**
 * Прокси вместо готового объекта: клиент создаётся при первом обращении
 * к любому методу, а не при импорте файла.
 */
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    return Reflect.get(connect(), property, receiver);
  },
});

export { schema };
