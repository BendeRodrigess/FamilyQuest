import "server-only";

import { prisma } from "../prisma";

/**
 * Читання сповіщень.
 *
 * Кожна функція приймає `userId`, і викликати її дозволено лише зі
 * значенням із серверної сесії. Підставити чужий ID через інтерфейс
 * неможливо: жодна серверна дія не бере адресата від клієнта.
 */

/** Скільки непрочитаних — для лічильника біля дзвіночка. */
export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/**
 * Історія сповіщень, найсвіжіші зверху.
 *
 * Прочитані не зникають: людина має бачити, що саме їй писали.
 * Обмеження в 100 записів — щоб сторінка лишалася швидкою; коли історії
 * стане більше, тут з'явиться посторінкова навігація.
 */
export async function listNotifications(userId: string, take = 100) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
