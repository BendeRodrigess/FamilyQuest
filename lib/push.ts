import "server-only";

import webpush from "web-push";

import { prisma } from "./prisma";

/**
 * Web Push — додатковий канал доставки, а не джерело правди.
 *
 * Сповіщення спочатку з'являється в базі (`Notification` або
 * `Announcement`), і лише потім про нього намагаються повідомити назовні.
 * Якщо push-сервіс Google, Apple чи Mozilla недоступний, у центрі 🔔
 * повідомлення все одно є — людина побачить його при наступному відкритті.
 *
 * Тому жодна функція тут не кидає помилок назовні: підтвердження
 * завдання не має відкочуватися через те, що чийсь телефон недосяжний.
 */

/** Скільки невдач поспіль терпимо, перш ніж вважати підписку мертвою. */
const MAX_FAILURES = 5;

/** Скільки підписок обробляємо одночасно — щоб не відкривати сотні з'єднань. */
const BATCH_SIZE = 50;

export type PushPayload = {
  title: string;
  body: string;
  /** Внутрішній маршрут, куди веде натискання. */
  href?: string | null;
  /** Що саме прийшло — Service Worker використовує для тегування. */
  tag?: string;
};

type Target = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

let configured: boolean | null = null;

/**
 * Налаштовує VAPID один раз за процес.
 *
 * Приватний ключ живе лише в змінних оточення сервера: у клієнтський
 * бандл він не потрапляє, бо цей модуль — `server-only`.
 */
function ready(): boolean {
  if (configured !== null) return configured;

  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"];

  if (!publicKey || !privateKey || !subject) {
    // Ключів немає — push просто вимкнений. Це нормальний стан для
    // локальної розробки й для першого запуску на сервері.
    configured = false;
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/** Публічний ключ для браузера. Його можна віддавати клієнту. */
export function publicKey(): string | null {
  return process.env["VAPID_PUBLIC_KEY"] ?? null;
}

/**
 * Надсилає push на всі пристрої одного користувача.
 *
 * Повертає, скільки доставлено — потрібно фоновому job'у для логів.
 */
export async function pushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ready()) return 0;

  try {
    const targets = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    return await deliver(targets, payload);
  } catch (error) {
    // Контракт цієї функції — ніколи не кидати помилку назовні.
    console.error("[push] не вдалося надіслати користувачу:", error);
    return 0;
  }
}

/**
 * Надсилає push усім користувачам із перелічених аудиторій.
 *
 * Підписки читаються порціями через курсор, а не одним масивом: новина
 * для всієї бази не повинна вимагати тримати в пам'яті всіх користувачів.
 */
export async function pushToAudience(
  audiences: string[],
  payload: PushPayload,
): Promise<number> {
  if (!ready()) return 0;

  const roles = rolesFor(audiences);
  if (roles.length === 0) return 0;

  let delivered = 0;
  let cursor: string | undefined;

  try {
    for (;;) {
      const batch = await prisma.pushSubscription.findMany({
        where: { user: { role: { in: roles } } },
        select: { id: true, endpoint: true, p256dh: true, auth: true },
        orderBy: { id: "asc" },
        take: BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      if (batch.length === 0) break;

      delivered += await deliver(batch, payload);
      cursor = batch[batch.length - 1].id;
    }
  } catch (error) {
    console.error("[push] розсилка перервалася:", error);
  }

  return delivered;
}

/** Які ролі входять у ці аудиторії. */
function rolesFor(audiences: string[]): string[] {
  const roles = new Set<string>();

  for (const audience of audiences) {
    if (audience === "ALL") {
      roles.add("PARENT");
      roles.add("CHILD");
    }
    if (audience === "PARENTS") roles.add("PARENT");
    if (audience === "CHILDREN") roles.add("CHILD");
  }

  return [...roles];
}

/**
 * Власне відправлення.
 *
 * Пристрої обробляються паралельно й незалежно: зламана підписка на
 * старому планшеті не повинна заблокувати доставку на телефон.
 */
async function deliver(targets: Target[], payload: PushPayload): Promise<number> {
  if (targets.length === 0) return 0;

  const body = JSON.stringify(payload);

  const results = await Promise.all(
    targets.map(async (target) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: target.endpoint,
            keys: { p256dh: target.p256dh, auth: target.auth },
          },
          body,
        );

        await prisma.pushSubscription.update({
          where: { id: target.id },
          data: { lastSuccessAt: new Date(), failureCount: 0 },
        });

        return true;
      } catch (error) {
        await handleFailure(target, error);
        return false;
      }
    }),
  );

  return results.filter(Boolean).length;
}

/**
 * Що робити з невдачею.
 *
 * 404 і 410 від push-сервісу означають, що такого отримувача більше не
 * існує: користувач відкликав дозвіл, очистив дані або видалив браузер.
 * Таку підписку видаляємо одразу.
 *
 * Решта — мережа, тайм-аут, тимчасова недоступність сервісу — не привід
 * втрачати пристрій. Рахуємо невдачі й прибираємо лише після п'яти
 * поспіль.
 */
async function handleFailure(target: Target, error: unknown): Promise<void> {
  const status =
    typeof error === "object" && error !== null && "statusCode" in error
      ? Number((error as { statusCode: unknown }).statusCode)
      : 0;

  try {
    if (status === 404 || status === 410) {
      await prisma.pushSubscription.delete({ where: { id: target.id } });
      return;
    }

    const updated = await prisma.pushSubscription.update({
      where: { id: target.id },
      data: { failureCount: { increment: 1 } },
      select: { failureCount: true },
    });

    if (updated.failureCount >= MAX_FAILURES) {
      await prisma.pushSubscription.delete({ where: { id: target.id } });
    }
  } catch {
    // Підписку могли видалити паралельно — це не проблема.
  }

  // Без endpoint'ів і вмісту повідомлення: у логах лише факт і код.
  console.error(`[push] не доставлено, код ${status || "невідомий"}`);
}
