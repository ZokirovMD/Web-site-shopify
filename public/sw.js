/**
 * ORBIT — service worker.
 *
 * Здесь важнее то, чего он НЕ делает.
 *
 * Он не кеширует страницы приложения. Ни одной. В них личные деньги, тело
 * и переписка, и складывать это в хранилище браузера ради красивой надписи
 * «работает офлайн» — плохой обмен. Кешируются только сборочные файлы с
 * хешем в имени, иконки и одна статическая страница-заглушка.
 *
 * Что он даёт по-настоящему:
 *   — приложение ставится на домашний экран и открывается своим окном;
 *   — при обрыве связи показывает внятную страницу вместо динозавра;
 *   — повторные заходы стартуют быстрее: скрипты и стили уже лежат рядом.
 */

const VERSION = "orbit-v1";
const ASSETS = `${VERSION}-assets`;
const SHELL = `${VERSION}-shell`;
const OFFLINE = "/offline";

const PRECACHE = [OFFLINE, "/icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      // Один недоступный файл не должен срывать установку целиком.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== ASSETS && key !== SHELL)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Файлы сборки: имя содержит хеш, содержимое по этому адресу не меняется. */
function isImmutableAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isIcon(url) {
  return /^\/(icon|apple-icon)[-.]/.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Навигация: всегда в сеть. Офлайн — заглушка, но никогда не чужой прошлый экран.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE).then((cached) => cached ?? Response.error()),
      ),
    );
    return;
  }

  if (isImmutableAsset(url) || isIcon(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            // Кладём только целые ответы: частичный или ошибочный кеш хуже пустого.
            if (response.ok && response.status === 200) {
              const copy = response.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Всё остальное — данные приложения. Только сеть, без следов на диске.
});
