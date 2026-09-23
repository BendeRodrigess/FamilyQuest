"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { approveTaskAction, rejectTaskAction } from "@/app/actions/tasks";
import { Avatar, FormError, Pill, RewardPills } from "@/components/ui";
import { LocalDateTime } from "@/components/LocalDateTime";

export type ReviewItem = {
  taskId: string;
  title: string;
  childName: string;
  childColor: string;
  /** Момент подання; порожньо — ще не подано. */
  submittedAtIso: string | null;
  submittedLabel: string;
  childComment: string | null;
  xp: number;
  coins: number;
  /** Сюди привело сповіщення — картку підсвічуємо й гортаємо до неї. */
  highlight?: boolean;
};

export function ReviewCard({ item }: { item: ReviewItem }) {
  const [rejecting, setRejecting] = useState(false);
  const [approveState, approve, approving] = useActionState(approveTaskAction, null);
  const [rejectState, reject, isRejecting] = useActionState(rejectTaskAction, null);

  const busy = approving || isRejecting;

  // Зі сповіщення батько приходить до конкретного завдання, а на перевірці
  // їх може бути кілька — гортаємо до потрібного.
  const card = useRef<HTMLElement>(null);
  useEffect(() => {
    if (item.highlight) card.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [item.highlight]);

  return (
    <article
      ref={card}
      className={`fq-card-flat p-4 ${item.highlight ? "ring-2 ring-[var(--color-brand)]" : ""}`}
    >
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <h3 className="font-bold leading-snug text-[var(--color-ink)]">{item.title}</h3>
        <Pill tone="amber">На перевірці</Pill>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Avatar name={item.childName} color={item.childColor} size="sm" />
        <span>
          {item.childName} · позначено виконаним{" "}
          {item.submittedAtIso ? (
            <LocalDateTime
              iso={item.submittedAtIso}
              initial={item.submittedLabel}
              variant="submitted"
            />
          ) : (
            item.submittedLabel
          )}
        </span>
      </div>

      {item.childComment && (
        <p className="mb-3 rounded-[var(--radius-control)] bg-[var(--color-slate-soft)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
          «{item.childComment}»
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <RewardPills xp={item.xp} coins={item.coins} />
      </div>

      {rejecting ? (
        <form action={reject} className="flex flex-col gap-2.5">
          <input type="hidden" name="taskId" value={item.taskId} />
          <textarea
            name="comment"
            rows={2}
            required
            autoFocus
            className="fq-input resize-none"
            placeholder="Що саме потрібно переробити?"
          />
          <FormError message={rejectState?.error} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="fq-btn fq-btn-ghost flex-1"
              disabled={busy}
            >
              Скасувати
            </button>
            <button type="submit" className="fq-btn fq-btn-outline flex-1" disabled={busy}>
              {isRejecting ? "Надсилаємо…" : "Відхилити"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="fq-btn fq-btn-outline flex-1"
            disabled={busy}
          >
            Відхилити
          </button>
          <form action={approve} className="flex-1">
            <input type="hidden" name="taskId" value={item.taskId} />
            <button type="submit" className="fq-btn fq-btn-success w-full" disabled={busy}>
              {approving ? "Зараховуємо…" : "Підтвердити"}
            </button>
          </form>
        </div>
      )}

      <FormError message={approveState?.error} />
    </article>
  );
}
