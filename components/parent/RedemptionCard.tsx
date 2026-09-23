"use client";

import { useActionState, useState } from "react";

import { declineRedemptionAction, fulfillRedemptionAction } from "@/app/actions/shop";
import { Avatar, FormError, Pill } from "@/components/ui";
import { LocalDateTime } from "@/components/LocalDateTime";

export type RedemptionItem = {
  id: string;
  title: string;
  emoji: string;
  cost: number;
  childName: string;
  childColor: string;
  requestedAtIso: string;
  requestedLabel: string;
  childNote: string | null;
};

export function RedemptionCard({ item }: { item: RedemptionItem }) {
  const [declining, setDeclining] = useState(false);
  const [fulfillState, fulfill, isFulfilling] = useActionState(fulfillRedemptionAction, null);
  const [declineState, decline, isDeclining] = useActionState(declineRedemptionAction, null);

  const busy = isFulfilling || isDeclining;

  return (
    <article className="fq-card-flat p-4">
      <div className="mb-2.5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] text-xl">
          {item.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-snug">{item.title}</h3>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            замовлено{" "}
            <LocalDateTime
              iso={item.requestedAtIso}
              initial={item.requestedLabel}
              variant="submitted"
            />
          </p>
        </div>
        <Pill tone="amber">Очікує видачі</Pill>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Avatar name={item.childName} color={item.childColor} size="sm" />
        <span>{item.childName}</span>
      </div>

      {item.childNote && (
        <p className="mb-3 rounded-[var(--radius-control)] bg-[var(--color-slate-soft)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
          «{item.childNote}»
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Pill tone="mint">списано {item.cost} коінів</Pill>
      </div>

      {declining ? (
        <form action={decline} className="flex flex-col gap-2.5">
          <input type="hidden" name="redemptionId" value={item.id} />
          <p className="text-sm text-[var(--color-muted)]">
            Коіни повернуться дитині повністю — відмова не забирає зароблене.
          </p>
          <textarea
            name="comment"
            rows={2}
            required
            autoFocus
            className="fq-input resize-none"
            placeholder="Чому зараз не виходить?"
          />
          <FormError message={declineState?.error} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeclining(false)}
              className="fq-btn fq-btn-ghost flex-1"
              disabled={busy}
            >
              Скасувати
            </button>
            <button type="submit" className="fq-btn fq-btn-outline flex-1" disabled={busy}>
              {isDeclining ? "Надсилаємо…" : "Відхилити"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDeclining(true)}
            className="fq-btn fq-btn-outline flex-1"
            disabled={busy}
          >
            Не зараз
          </button>
          <form action={fulfill} className="flex-1">
            <input type="hidden" name="redemptionId" value={item.id} />
            <button type="submit" className="fq-btn fq-btn-success w-full" disabled={busy}>
              {isFulfilling ? "Зберігаємо…" : "Видано"}
            </button>
          </form>
        </div>
      )}

      <FormError message={fulfillState?.error} />
    </article>
  );
}
