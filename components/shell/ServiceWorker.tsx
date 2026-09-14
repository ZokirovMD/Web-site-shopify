"use client";

import { useEffect } from "react";

/**
 * Регистрация service worker.
 *
 * Только в собранном приложении: в разработке кеш скриптов приводит к тому,
 * что правка не видна, и полчаса уходит на поиск несуществующей ошибки.
 *
 * Ничего не рисует. Ошибку регистрации глотаем: браузер без поддержки или
 * запрет хранилища — не причина ломать страницу, приложение работает и так,
 * просто не ставится на домашний экран отдельным окном.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    };

    // После загрузки: регистрация не должна соревноваться за сеть с первым экраном.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
