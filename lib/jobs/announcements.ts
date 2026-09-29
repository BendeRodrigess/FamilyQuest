import "server-only";

import { prisma } from "../prisma";
import { ANNOUNCEMENT_KINDS } from "../notifications/catalog";
import { pushToAudience } from "../push";

/**
 * Push про новини FamilyQuest.
 *
 * Чому не в момент публікації, а фоновим job'ом:
 *
 * 1. Новину можна запланувати на майбутнє. Публікація тоді відбувається
 *    сама, коли настане `publishedAt` — і хтось має це помітити.
 * 2. CLI публікації працює напряму через `pg` і не тягне за собою ні
 *    Prisma, ні шифрування push. Розсилка на тисячі пристроїв — не те,
 *    що має відбуватися всередині однієї консольної команди.
 * 3. Job уже працює кожні 5 хвилин і вміє логувати підсумок.
 *
 * Захист від повторної розсилки — одна колонка `Announcement.pushedAt`.
 * Job бере лише новини без неї й ставить позначку одразу після
 * відправлення. Окрема таблиця статусів доставки для цього зайва: нас
 * цікавить не «кому доставлено», а «чи розсилали взагалі».
 */

export type AnnouncementPushSummary = {
  /** Скільки новин чекало на розсилку. */
  pending: number;
  /** Скільки push-повідомлень фактично прийнято push-сервісами. */
  delivered: number;
  errors: number;
};

export async function pushNewAnnouncements(
  now: Date = new Date(),
): Promise<AnnouncementPushSummary> {
  const summary: AnnouncementPushSummary = { pending: 0, delivered: 0, errors: 0 };

  const pending = await prisma.announcement.findMany({
    where: {
      publishedAt: { not: null, lte: now },
      pushedAt: null,
    },
    orderBy: { publishedAt: "asc" },
    select: { id: true, category: true, audience: true, title: true, body: true, href: true },
  });

  summary.pending = pending.length;

  for (const announcement of pending) {
    try {
      // Позначку ставимо ДО відправлення. Краще один раз не доставити,
      // ніж після падіння посеред розсилки надіслати всім удруге:
      // повторний push виглядає як зламаний застосунок.
      await prisma.announcement.update({
        where: { id: announcement.id },
        data: { pushedAt: new Date() },
      });

      const emoji = ANNOUNCEMENT_KINDS[announcement.category]?.emoji ?? "📣";

      summary.delivered += await pushToAudience([announcement.audience], {
        title: `${emoji} ${announcement.title}`,
        body: announcement.body,
        href: announcement.href,
        tag: `announcement:${announcement.id}`,
      });
    } catch (error) {
      summary.errors += 1;
      console.error("[jobs/announcements] не вдалося розіслати новину:", error);
    }
  }

  return summary;
}
