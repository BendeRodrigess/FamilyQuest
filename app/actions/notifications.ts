"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  markAllAnnouncementsRead,
  markAnnouncementRead,
} from "@/lib/notifications/announcements";

/**
 * Дії над власною стрічкою сповіщень.
 *
 * Адресат і роль беруться виключно з серверної сесії. ID з клієнта
 * приходить, але не довіряється:
 *
 * — персональні сповіщення оновлюються через updateMany із фільтром за
 *   userId, тож чужий ID просто оновить нуль рядків;
 * — новини перевіряються на аудиторію й факт публікації, тож позначити
 *   прочитаною чужу або ще не видану новину неможливо.
 *
 * В обох випадках відмова тиха: за нею не видно, існує такий запис
 * узагалі чи ні.
 */

/** Лічильник біля дзвіночка живе в лейауті, тому оновлюємо саме його. */
function revalidateShell(role: string) {
  revalidatePath(role === "PARENT" ? "/parent" : "/child", "layout");
}

export async function markNotificationReadAction(id: string): Promise<void> {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidateShell(user.role);
}

export async function markAnnouncementReadAction(id: string): Promise<void> {
  const user = await requireUser();

  await markAnnouncementRead(id, user.id, user.role);

  revalidateShell(user.role);
}

/** Обидва джерела одразу — для користувача це один список. */
export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();

  await Promise.all([
    prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    }),
    markAllAnnouncementsRead(user.id, user.role),
  ]);

  revalidateShell(user.role);
}
