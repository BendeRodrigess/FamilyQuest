"use client";

import { useActionState, useState } from "react";

import { resetChildPasswordAction } from "@/app/actions/children";
import { Avatar, FormError, Pill, ProgressBar } from "@/components/ui";
import { IconKey } from "@/components/icons";

export type ChildSummary = {
  id: string;
  displayName: string;
  username: string;
  avatarColor: string;
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number;
  coinsBalance: number;
  coinsEarnedTotal: number;
  activeTasks: number;
};

export function ChildCard({ child }: { child: ChildSummary }) {
  const [state, formAction, isPending] = useActionState(resetChildPasswordAction, null);
  const [open, setOpen] = useState(false);

  return (
    <article className="fq-card-flat p-4">
      <div className="flex items-start gap-3">
        <Avatar name={child.displayName} color={child.avatarColor} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold">{child.displayName}</h3>
            <Pill tone="lilac">Рівень {child.level}</Pill>
          </div>

          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            Логін: <span className="font-semibold text-[var(--color-ink-soft)]">{child.username}</span>
          </p>

          <div className="mt-3">
            <ProgressBar value={child.progress} />
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              {child.xpIntoLevel} / {child.xpForNextLevel} XP до наступного рівня
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="lilac">{child.xp} XP усього</Pill>
            <Pill tone="mint">{child.coinsBalance} коінів доступно</Pill>
            <Pill tone="grey">{child.activeTasks} активних завдань</Pill>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--color-line)] pt-3">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="fq-btn fq-btn-ghost !px-2.5 text-sm"
          >
            <IconKey className="h-[1.15rem] w-[1.15rem]" />
            Змінити пароль
          </button>
        ) : (
          <form action={formAction} className="flex flex-col gap-2.5">
            <input type="hidden" name="childId" value={child.id} />
            <p className="text-sm text-[var(--color-muted)]">
              Поточний пароль ніде не зберігається у відкритому вигляді — задай новий і передай
              його дитині.
            </p>
            <input
              name="password"
              type="text"
              required
              minLength={4}
              className="fq-input"
              placeholder="Новий пароль"
              autoFocus
            />
            <FormError message={state?.error} />
            {state?.success && (
              <div className="rounded-[var(--radius-control)] bg-[var(--color-green-soft)] px-3 py-2 text-sm text-[var(--color-green-ink)]">
                <p className="font-medium">{state.success}</p>
                {state.revealPassword && (
                  <p className="mt-1 font-mono text-base font-bold">{state.revealPassword}</p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="fq-btn fq-btn-ghost"
                disabled={isPending}
              >
                Закрити
              </button>
              <button type="submit" className="fq-btn fq-btn-outline flex-1" disabled={isPending}>
                {isPending ? "Зберігаємо…" : "Зберегти новий пароль"}
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}
