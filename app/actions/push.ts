"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

/**
 * Реєстрація й скасування push-підписки конкретного пристрою.
 *
 * Власник завжди береться з серверної сесії. Клієнт передає лише те, що
 * видав йому браузер: адресу push-сервісу та ключі шифрування.
 */

export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function savePushSubscriptionAction(
  subscription: PushSubscriptionInput,
  userAgent: string,
): Promise<void> {
  const user = await requireUser();

  const { endpoint, p256dh, auth } = subscription;
  if (!endpoint || !p256dh || !auth) return;

  // Адреса push-сервісу глобально унікальна, тому вона й визначає
  // пристрій. Якщо на спільному планшеті зайшов інший член сім'ї,
  // підписка **переходить** до нього: попередній власник більше не
  // отримуватиме туди своїх сповіщень. Створювати другий рядок на той
  // самий пристрій не можна — тоді одне повідомлення приходило б двічі.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: user.id,
      endpoint,
      p256dh,
      auth,
      userAgent: userAgent.slice(0, 200) || null,
    },
    update: {
      userId: user.id,
      p256dh,
      auth,
      userAgent: userAgent.slice(0, 200) || null,
      failureCount: 0,
    },
  });
}

/**
 * Вимикає push на цьому пристрої.
 *
 * Фільтр за userId навмисний: навіть знаючи чужу адресу, відписати
 * чужий пристрій не вийде. Інші пристрої цього ж користувача лишаються
 * підписаними — вимикається рівно той, з якого натиснули.
 */
export async function removePushSubscriptionAction(endpoint: string): Promise<void> {
  const user = await requireUser();
  if (!endpoint) return;

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: user.id },
  });
}
