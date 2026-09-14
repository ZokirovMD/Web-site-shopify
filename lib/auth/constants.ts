/**
 * ORBIT — константы входа без единой зависимости от node.
 *
 * Отдельный модуль намеренно: middleware работает на edge, где нет ни
 * node:crypto, ни драйвера базы. Импорт константы из session.ts утягивал бы
 * в edge-бандл весь этот хвост, и сборка падала бы на UnhandledSchemeError.
 */
export const SESSION_COOKIE = "orbit_session";
export const SESSION_DAYS = 30;
