"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/actions/auth";
import { Avatar } from "./ui";
import { ThemeToggle } from "./theme/ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import {
  IconHome,
  IconTasks,
  IconFamily,
  IconRewards,
  IconSettings,
  IconLogout,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: ReactNode;
  badge?: number;
};

export type ShellUser = {
  displayName: string;
  subtitle: string;
  avatarColor: string;
  role: "PARENT" | "CHILD";
};

const iconClass = "h-[1.15rem] w-[1.15rem]";

export type Badges = { tasks?: number; rewards?: number; notifications?: number };

function buildNav(role: "PARENT" | "CHILD", badges: Badges): NavItem[] {
  if (role === "PARENT") {
    return [
      { href: "/parent", label: "Головна", shortLabel: "Головна", icon: <IconHome className={iconClass} /> },
      { href: "/parent/tasks", label: "Завдання", shortLabel: "Завдання", icon: <IconTasks className={iconClass} />, badge: badges.tasks },
      { href: "/parent/family", label: "Моя сім'я", shortLabel: "Сім'я", icon: <IconFamily className={iconClass} /> },
      { href: "/parent/rewards", label: "Винагороди", shortLabel: "Коіни", icon: <IconRewards className={iconClass} />, badge: badges.rewards },
      { href: "/parent/settings", label: "Налаштування", shortLabel: "Ще", icon: <IconSettings className={iconClass} /> },
    ];
  }

  return [
    { href: "/child", label: "Головна", shortLabel: "Головна", icon: <IconHome className={iconClass} /> },
    { href: "/child/tasks", label: "Мої квести", shortLabel: "Квести", icon: <IconTasks className={iconClass} />, badge: badges.tasks },
    { href: "/child/family", label: "Моя сім'я", shortLabel: "Сім'я", icon: <IconFamily className={iconClass} /> },
    { href: "/child/rewards", label: "Винагороди", shortLabel: "Коіни", icon: <IconRewards className={iconClass} /> },
    { href: "/child/settings", label: "Налаштування", shortLabel: "Ще", icon: <IconSettings className={iconClass} /> },
  ];
}

function isActive(pathname: string, href: string, rootHref: string) {
  if (href === rootHref) return pathname === rootHref;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  badges = {},
  children,
}: {
  user: ShellUser;
  badges?: Badges;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const nav = buildNav(user.role, badges);
  const rootHref = user.role === "PARENT" ? "/parent" : "/child";

  return (
    <div className="min-h-full">
      {/* Верхня панель */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-3 px-4 lg:px-6">
          <Link href={rootHref} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--color-brand)] text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12 3.2 14.1 8l5.2.5-3.9 3.4 1.2 5.1L12 14.3 7.4 17l1.2-5.1L4.7 8.5 9.9 8Z" />
              </svg>
            </span>
            <span className="text-[1.0625rem] font-extrabold tracking-tight">FamilyQuest</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-bold">{user.displayName}</p>
              <p className="text-xs leading-tight text-[var(--color-muted)]">{user.subtitle}</p>
            </div>
            <Avatar name={user.displayName} color={user.avatarColor} />
            <NotificationBell href={`${rootHref}/notifications`} count={badges.notifications ?? 0} />
            <ThemeToggle />
            <form action={logoutAction}>
              <button
                type="submit"
                className="fq-btn fq-btn-ghost !px-2.5 !py-2"
                title="Вийти"
                aria-label="Вийти"
              >
                <IconLogout className="h-[1.15rem] w-[1.15rem]" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] gap-6 px-4 lg:px-6">
        {/* Бокова навігація — тільки на широких екранах */}
        <aside className="hidden w-[212px] shrink-0 py-6 lg:block">
          <nav className="sticky top-[5.5rem] flex flex-col gap-1">
            {nav.map((item) => {
              const active = isActive(pathname, item.href, rootHref);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[var(--radius-control)] px-3.5 py-2.5 text-[0.9375rem] font-semibold transition-colors ${
                    active
                      ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-ink)]"
                      : "text-[var(--color-ink-soft)] hover:bg-[var(--color-slate-soft)]"
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand)] px-1.5 text-xs font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Контент */}
        <main className="min-w-0 flex-1 py-6 pb-28 lg:pb-10">{children}</main>
      </div>

      {/* Нижня навігація — телефон і планшет */}
      <nav className="fq-safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-[var(--color-surface)] lg:hidden">
        <div className="mx-auto flex max-w-[560px] items-stretch">
          {nav.map((item) => {
            const active = isActive(pathname, item.href, rootHref);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.6875rem] font-semibold transition-colors ${
                  active ? "text-[var(--color-brand-ink)]" : "text-[var(--color-muted)]"
                }`}
              >
                <span className="relative">
                  {item.icon}
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[0.625rem] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                {item.shortLabel}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
