"use client";

import { useEffect } from "react";

/**
 * Реєструє service worker — без нього браузер не пропонує «встановити застосунок».
 * У режимі розробки не реєструємо, щоб кеш не заважав перезавантаженню.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Реєстрація не критична: без неї застосунок працює як звичайний сайт.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
