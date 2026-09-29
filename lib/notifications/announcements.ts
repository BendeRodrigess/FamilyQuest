import "server-only";

import { prisma } from "../prisma";

/**
 * Новини про сам FamilyQuest.
 *
 * Одна публікація — один рядок `Announcement`, скільки б не було
 * користувачів. Персональний статус прочитання живе окремо, в
 * `AnnouncementRead`, і рядок там з'являється лише в момент прочитання.
 *
 * Створюються новини лише серверним CLI (`npm run announce`). Жодного
 * шляху створення з боку застосунку не існує — отже, і перевіряти
 * права на створення ніде не треба.
 */

export const CATEGORIES = ["FEATURE", "FIX", "UPDATE", "IMPORTANT"] as const;
export const AUDIENCES = ["ALL", "PARENTS", "CHILDREN"] as const;

/**
 * Які аудиторії бачить ця роль.
 *
 * Роль приходить із серверної сесії й ніколи з боку клієнта — саме тому
 * підставити чужий ID у запит марно: він не пройде цей фільтр.
 */
export function audienceFor(role: string): string[] {
  return role === "PARENT" ? ["ALL", "PARENTS"] : ["ALL", "CHILDREN"];
}

/**
 * Умова «цей користувач має це бачити».
 *
 * Чернетка (`publishedAt = null`) і відкладена публікація (момент у
 * майбутньому) не видно нікому: порівнюємо абсолютні моменти, зона тут
 * ні до чого.
 */
function visibleTo(role: string, now: Date) {
  return {
    publishedAt: { not: null, lte: now },
    audience: { in: audienceFor(role) },
  };
}

/** Скільки новин цей користувач ще не читав. */
export async function unreadAnnouncements(
  userId: string,
  role: string,
  now: Date = new Date(),
): Promise<number> {
  return prisma.announcement.count({
    where: {
      ...visibleTo(role, now),
      // NOT EXISTS по (announcementId, userId) — первинний ключ
      // AnnouncementRead, тож перевірка лишається дешевою навіть
      // коли новин стане багато.
      reads: { none: { userId } },
    },
  });
}

/**
 * Новини для центру сповіщень, найсвіжіші зверху.
 *
 * Разом із кожною тягнемо позначку прочитання саме цього користувача —
 * одним запитом, без окремого звернення на кожен рядок.
 */
export async function listAnnouncements(
  userId: string,
  role: string,
  now: Date = new Date(),
  take = 100,
) {
  return prisma.announcement.findMany({
    where: visibleTo(role, now),
    orderBy: { publishedAt: "desc" },
    take,
    select: {
      id: true,
      category: true,
      title: true,
      body: true,
      href: true,
      publishedAt: true,
      reads: { where: { userId }, select: { readAt: true } },
    },
  });
}

/**
 * Позначає новину прочитаною.
 *
 * Спершу переконуємось, що новина взагалі доступна цьому користувачу:
 * інакше підставлений ID дозволив би створити позначку на чужій
 * аудиторії або на чернетці. Відмова тиха — за нею не видно, існує
 * такий запис узагалі чи ні.
 */
export async function markAnnouncementRead(
  announcementId: string,
  userId: string,
  role: string,
  now: Date = new Date(),
): Promise<void> {
  const allowed = await prisma.announcement.findFirst({
    where: { id: announcementId, ...visibleTo(role, now) },
    select: { id: true },
  });
  if (!allowed) return;

  await prisma.announcementRead.createMany({
    data: [{ announcementId, userId }],
    // Другий клік або два вкладки одночасно — не помилка.
    skipDuplicates: true,
  });
}

/** Позначає прочитаними всі доступні користувачу новини. */
export async function markAllAnnouncementsRead(
  userId: string,
  role: string,
  now: Date = new Date(),
): Promise<void> {
  const unread = await prisma.announcement.findMany({
    where: { ...visibleTo(role, now), reads: { none: { userId } } },
    select: { id: true },
  });

  if (unread.length === 0) return;

  await prisma.announcementRead.createMany({
    data: unread.map((item) => ({ announcementId: item.id, userId })),
    skipDuplicates: true,
  });
}
