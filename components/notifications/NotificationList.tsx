"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  markAllNotificationsReadAction,
  markAnnouncementReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import { feedEmoji } from "@/lib/notifications/catalog";
import type { FeedItem } from "@/lib/notifications/feed";
import { LocalDateTime } from "@/components/LocalDateTime";
import { IconBell, IconCheck } from "@/components/icons";
import { EmptyState } from "@/components/ui";

/**
 * Центр сповіщень: персональні сповіщення й новини FamilyQuest одним
 * списком. Для людини це не два різні потоки, а одна стрічка подій —
 * різницю видно лише за емодзі.
 *
 * Прочитані не зникають — людина має бачити, що саме їй писали. Вони лише
 * блякнуть і втрачають крапку, тому свіже видно одразу.
 *
 * Розмітка розрахована насамперед на телефон: один стовпчик, велика
 * область натискання, дата окремим рядком.
 */
export function NotificationList({ items }: { items: FeedItem[] }) {
  const [pending, startTransition] = useTransition();
  const unread = items.filter((item) => !item.read).length;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconBell className="h-7 w-7" />}
        title="Сповіщень поки немає"
        hint="Тут з'являтимуться новини про твої завдання."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => markAllNotificationsReadAction())}
            className="fq-btn fq-btn-ghost !py-1.5 text-sm"
          >
            Позначити всі як прочитані
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function Row({ item }: { item: FeedItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const emoji = feedEmoji(item.kind, item.type);

  // Персональне сповіщення й новина позначаються прочитаними різними
  // діями: у новини статус прочитання зберігається окремою сутністю.
  const markRead = () =>
    item.kind === "announcement"
      ? markAnnouncementReadAction(item.id)
      : markNotificationReadAction(item.id);

  // Натискання на сповіщення веде до завдання й одночасно позначає
  // прочитаним. Перехід не чекає на сервер: посилання звичайне, тож
  // працює й без JavaScript.
  function open() {
    if (item.read) return;
    startTransition(markRead);
  }

  // Прочитати, не переходячи нікуди. Для новини без href це єдиний спосіб.
  function markReadInPlace() {
    startTransition(async () => {
      await markRead();
      router.refresh();
    });
  }

  const content = (
    <>
      <span className="text-xl leading-none" aria-hidden="true">
        {emoji}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`leading-snug ${item.read ? "font-semibold" : "font-extrabold"}`}>
            {item.title}
          </span>
          {!item.read && (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand)]"
              aria-label="непрочитане"
            />
          )}
        </span>

        <span className="mt-0.5 block text-sm text-[var(--color-ink-soft)]">{item.body}</span>

        <span className="mt-1 block text-xs text-[var(--color-muted)]">
          <LocalDateTime iso={item.createdAtIso} initial={item.dateLabel} variant="submitted" />
        </span>
      </span>
    </>
  );

  // Непрочитаним лишаємо місце справа під кнопку «прочитано».
  const shell = `fq-card-flat flex items-start gap-3 p-3.5 ${
    item.read ? "opacity-70" : "border-[var(--color-brand)] pr-12"
  }`;

  return (
    <li className="relative">
      {item.href ? (
        <Link href={item.href} onClick={open} className={`${shell} transition-opacity`}>
          {content}
        </Link>
      ) : (
        <div className={shell}>{content}</div>
      )}

      {/* Прочитати, не відкриваючи. Поза посиланням — кнопка всередині
          посилання була б некоректною розміткою. */}
      {!item.read && (
        <button
          type="button"
          onClick={markReadInPlace}
          disabled={pending}
          title="Позначити прочитаним"
          aria-label={`Позначити прочитаним: ${item.title}`}
          className="fq-btn fq-btn-ghost absolute top-2.5 right-2.5 !px-2 !py-1.5"
        >
          <IconCheck className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
