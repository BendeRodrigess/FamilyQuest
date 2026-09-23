"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/time";

/**
 * Запам'ятовує часовий пояс пристрою.
 *
 * Браузер знає свою зону сам, а серверу вона потрібна там, де браузера
 * поруч немає: генерація повторюваних завдань і підрахунок серії.
 *
 * Значення приходить із клієнта, тому перевіряємо його через Intl —
 * у базу має потрапити лише справжня IANA-зона.
 */
export async function saveTimeZone(zone: string): Promise<void> {
  const user = await requireUser();

  if (!isValidTimeZone(zone) || zone === user.timeZone) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { timeZone: zone },
  });
}
