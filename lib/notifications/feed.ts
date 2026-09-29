import "server-only";

import { formatSubmittedLabel } from "../format";
import { listAnnouncements, unreadAnnouncements } from "./announcements";
import { listNotifications, unreadCount } from "./query";

/**
 * Єдина стрічка центру сповіщень.
 *
 * Користувач не повинен розбиратися, що з цього «персональне
 * сповіщення», а що «новина застосунку» — для нього це один список,
 * відсортований за часом. Тому обидва джерела зводяться тут до одного
 * типу, а різницю видно лише за емодзі.
 *
 * Об'єднання робиться в пам'яті, а не запитом UNION: кожне джерело
 * віддає щонайбільше `take` рядків, тож сортувати доводиться пару сотень
 * записів, і обидва запити лишаються простими та індексованими.
 */

export type FeedItem = {
  /** Від цього залежить, яка серверна дія позначає елемент прочитаним. */
  kind: "notification" | "announcement";
  id: string;
  /** Тип сповіщення або категорія новини — каталог дає по ньому емодзі. */
  type: string;
  title: string;
  body: string;
  href: string | null;
  createdAtIso: string;
  /** Підпис дати, порахований сервером за збереженою зоною користувача. */
  dateLabel: string;
  read: boolean;
};

export async function unreadTotal(userId: string, role: string): Promise<number> {
  const [personal, news] = await Promise.all([
    unreadCount(userId),
    unreadAnnouncements(userId, role),
  ]);

  return personal + news;
}

export async function buildFeed(
  userId: string,
  role: string,
  zone: string,
  now: Date = new Date(),
  take = 100,
): Promise<FeedItem[]> {
  const [notifications, announcements] = await Promise.all([
    listNotifications(userId, take),
    listAnnouncements(userId, role, now, take),
  ]);

  const items: FeedItem[] = [
    ...notifications.map((item) => ({
      kind: "notification" as const,
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      href: item.href,
      createdAtIso: item.createdAt.toISOString(),
      dateLabel: formatSubmittedLabel(item.createdAt, now, zone),
      read: item.readAt !== null,
    })),
    ...announcements.map((item) => {
      // Для новини датою вважаємо момент публікації, а не створення:
      // чернетку могли написати за тиждень до того, як її випустили.
      const at = item.publishedAt ?? now;

      return {
        kind: "announcement" as const,
        id: item.id,
        type: item.category,
        title: item.title,
        body: item.body,
        href: item.href,
        createdAtIso: at.toISOString(),
        dateLabel: formatSubmittedLabel(at, now, zone),
        read: item.reads.length > 0,
      };
    }),
  ];

  items.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));

  return items.slice(0, take);
}
