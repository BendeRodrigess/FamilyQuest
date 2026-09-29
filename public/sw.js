// Мінімальний service worker для PWA.
//
// Дані в застосунку живі (завдання, XP, коіни), тому сторінки НЕ кешуються:
// показати вчорашній список квестів гірше, ніж чесно сказати «немає зв'язку».
// Кешуємо лише статику й офлайн-заглушку.

const CACHE = "familyquest-v1";
const OFFLINE_URL = "/offline";

const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Навігація: спершу мережа, при збої — офлайн-сторінка.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(OFFLINE_URL)) ?? Response.error();
      }),
    );
    return;
  }

  // Статика: спершу кеш, потім мережа.
  if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});

/* ============================================================
   Web Push
   ============================================================ */

// Push — це лише сигнал про повідомлення, яке вже існує всередині
// FamilyQuest. Якщо він не дійшов, сповіщення нікуди не зникає:
// людина побачить його в центрі 🔔 при наступному відкритті.

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // Пошкоджений або порожній payload не має валити обробник.
  }

  const title = payload.title || "FamilyQuest";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    // Однакові події перетирають одна одну замість того, щоб
    // накопичуватись стосом: десять нагадувань про той самий квест
    // нікому не потрібні.
    tag: payload.tag || "familyquest",
    renotify: false,
    data: { href: payload.href || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const href = (event.notification.data && event.notification.data.href) || "/";
  const target = new URL(href, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Застосунок уже відкритий — переводимо наявне вікно, а не
      // плодимо нові вкладки.
      for (const client of clientList) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(target).catch(() => {});
          }
          return;
        }
      }

      // Закритий — відкриваємо одразу на потрібній сторінці.
      if (self.clients.openWindow) await self.clients.openWindow(target);
    })(),
  );
});
