"use client";

import { useActionState, useState } from "react";

import { submitTaskAction } from "@/app/actions/tasks";
import type { TaskStatus } from "@/lib/domain";
import { FormError, Pill, RewardPills, StatusPill } from "@/components/ui";
import { LocalDateTime } from "@/components/LocalDateTime";
import { OverdueCountdown } from "./OverdueCountdown";
import { TimeLeft } from "./TimeLeft";

export type Quest = {
  taskId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** Дедлайн як абсолютний момент — підпис і таймер рахує браузер. */
  dueAtIso: string;
  /** Той самий підпис, порахований сервером за збереженою зоною. */
  dueLabel: string;
  timeLeft: string;
  parentComment: string | null;
  xp: number;
  coins: number;
  /** Момент зникнення — лише для прострочених квестів. */
  lostAtIso: string | null;
  /** Зараховується без батьківської перевірки. */
  autoApprove: boolean;
  /** Створене з повторюваного шаблону. */
  repeating: boolean;
};

export function QuestCard({ quest }: { quest: Quest }) {
  const [state, formAction, isPending] = useActionState(submitTaskAction, null);
  const [commenting, setCommenting] = useState(false);

  const canSubmit = quest.status === "ACTIVE" || quest.status === "REJECTED";
  const isDone = quest.status === "DONE";

  return (
    <article className={`fq-card-flat p-4 ${isDone ? "opacity-70" : ""}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-bold leading-snug">{quest.title}</h3>
        {quest.status === "ACTIVE" ? (
          <Pill tone="lilac">+{quest.xp} XP</Pill>
        ) : (
          <StatusPill status={quest.status} />
        )}
      </div>

      {quest.description && (
        <p className="mb-2 text-sm text-[var(--color-ink-soft)]">{quest.description}</p>
      )}

      <p className="mb-3 text-sm text-[var(--color-muted)]">
        <LocalDateTime iso={quest.dueAtIso} initial={quest.dueLabel} variant="due" />
        {quest.status === "ACTIVE" && (
          <span>
            {" · "}
            <TimeLeft dueAtIso={quest.dueAtIso} initial={quest.timeLeft} />
          </span>
        )}
      </p>

      {quest.status === "REJECTED" && quest.parentComment && (
        <p className="mb-3 rounded-[var(--radius-control)] bg-[var(--color-rose-soft)] px-3 py-2 text-sm text-[var(--color-rose-ink)]">
          Батьки написали: «{quest.parentComment}». Можна виправити й надіслати ще раз.
        </p>
      )}

      {quest.status === "PENDING_REVIEW" && (
        <p className="mb-3 rounded-[var(--radius-control)] bg-[var(--color-amber-soft)] px-3 py-2 text-sm text-[var(--color-amber-ink)]">
          Чекаємо на підтвердження батьків. XP і коіни нарахуються після нього.
        </p>
      )}

      {quest.status === "OVERDUE" && quest.lostAtIso && (
        <OverdueCountdown lostAtIso={quest.lostAtIso} />
      )}

      {/* Для активного квесту XP уже показані плашкою в куті — тут лишаються коіни й підказки. */}
      <div className="mb-3 flex flex-wrap gap-2">
        {quest.status === "ACTIVE" ? (
          <>
            {quest.coins > 0 && <Pill tone="mint">+{quest.coins} коінів</Pill>}
            {quest.autoApprove && <Pill tone="green">Зарахується одразу</Pill>}
            {quest.repeating && <Pill tone="sky">Повторюваний</Pill>}
          </>
        ) : (
          <RewardPills xp={quest.xp} coins={quest.coins} />
        )}
      </div>

      {canSubmit && (
        <form action={formAction} className="flex flex-col gap-2.5">
          <input type="hidden" name="taskId" value={quest.taskId} />

          {commenting ? (
            <textarea
              name="comment"
              rows={2}
              maxLength={500}
              autoFocus
              className="fq-input resize-none"
              placeholder="Хочеш щось додати? Наприклад: прочитав 14 сторінок"
            />
          ) : (
            <button
              type="button"
              onClick={() => setCommenting(true)}
              className="self-start text-sm font-semibold text-[var(--color-brand-ink)]"
            >
              + Додати коментар
            </button>
          )}

          <FormError message={state?.error} />

          <button type="submit" className="fq-btn fq-btn-quest" disabled={isPending}>
            {isPending ? "Надсилаємо…" : "Позначити виконаним"}
          </button>
        </form>
      )}
    </article>
  );
}
