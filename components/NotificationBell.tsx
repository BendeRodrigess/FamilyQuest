"use client";

import Link from "next/link";

import { IconBell } from "./icons";

/**
 * Дзвіночок у шапці з лічильником непрочитаних.
 *
 * Це звичайне посилання, а не випадна панель: на телефоні окрема сторінка
 * зручніша, та й історія сповіщень у панель усе одно не вмістилася б.
 *
 * Лічильник рахує сервер у лейауті — тут лише число.
 */
export function NotificationBell({ href, count }: { href: string; count: number }) {
  const label =
    count > 0 ? `Сповіщення, непрочитаних: ${count}` : "Сповіщення, непрочитаних немає";

  return (
    <Link
      href={href}
      className="fq-btn fq-btn-ghost relative !px-2.5 !py-2"
      title="Сповіщення"
      aria-label={label}
    >
      <IconBell className="h-[1.15rem] w-[1.15rem]" />

      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-rose-ink)] px-1 text-[0.625rem] font-extrabold text-white tabular-nums"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
