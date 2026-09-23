"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

/**
 * Дії над власними сповіщеннями.
 *
 * Адресат береться виключно з серверної сесії. ID сповіщення з клієнта
 * приходить, але він **не довіряється**: обидві дії працюють через
 * updateMany із фільтром за userId, тому чужий ID просто оновить нуль
 * рядків — без помилки й без натяку на те, існує він узагалі чи ні.
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

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidateShell(user.role);
}
