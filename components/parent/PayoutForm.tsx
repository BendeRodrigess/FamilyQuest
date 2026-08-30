"use client";

import { useActionState, useState } from "react";

import { payoutAction } from "@/app/actions/rewards";
import { FormError } from "@/components/ui";

export function PayoutForm({ childId, balance }: { childId: string; balance: number }) {
  const [state, formAction, isPending] = useActionState(payoutAction, null);
  const [open, setOpen] = useState(false);

  if (balance === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        Поки нема чого виплачувати — баланс порожній.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="fq-btn fq-btn-outline text-sm">
        Позначити виплату
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="childId" value={childId} />

      <p className="text-sm text-[var(--color-muted)]">
        Скільки коінів уже видано? Баланс зменшиться на цю суму, а «зароблено всього» лишиться
        незмінним.
      </p>

      <div className="flex gap-2">
        <input
          name="amount"
          type="number"
          min={1}
          max={balance}
          defaultValue={balance}
          required
          autoFocus
          className="fq-input w-32"
        />
        <input
          name="note"
          type="text"
          maxLength={200}
          className="fq-input flex-1"
          placeholder="Примітка — необов'язково"
        />
      </div>

      <FormError message={state?.error} />
      {state?.success && (
        <p className="rounded-[var(--radius-control)] bg-[var(--color-green-soft)] px-3 py-2 text-sm font-medium text-[var(--color-green-ink)]">
          {state.success}
        </p>
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
        <button type="submit" className="fq-btn fq-btn-primary flex-1" disabled={isPending}>
          {isPending ? "Записуємо…" : "Записати виплату"}
        </button>
      </div>
    </form>
  );
}
