"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import { kindOf } from "@/lib/notifications/catalog";
import { LocalDateTime } from "@/components/LocalDateTime";
import { IconBell, IconCheck } from "@/components/icons";
import { EmptyState } from "@/components/ui";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  createdAtIso: string;
  /** Підпис дати, порахований сервером за збереженою зоною. */
  dateLabel: string;
  read: boolean;
};

/**
 * Центр сповіщень.
 *
 * Прочитані не зникають — людина має бачити, що саме їй писали. Вони лише
 * блякнуть і втрачають крапку, тому свіже видно одразу.
 *
 * Розмітка розрахована насамперед на телефон: один стовпчик, велика
 * область натискання, дата окремим рядком.
 */
export function NotificationList({ items }: { items: NotificationItem[] }) {
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

function Row({ item }: { item: NotificationItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { emoji } = kindOf(item.type);

  // Натискання на сповіщення веде до завдання й одночасно позначає
  // прочитаним. Перехід не чекає на сервер: посилання звичайне, тож
  // працює й без JavaScript.
  function open() {
    if (item.read) return;
    startTransition(() => markNotificationReadAction(item.id));
  }

  function markRead() {
    startTransition(async () => {
      await markNotificationReadAction(item.id);
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
          onClick={markRead}
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
