"use client";

import { useActionState, useState } from "react";

import { redeemRewardAction } from "@/app/actions/shop";
import { FormError, Pill, ProgressBar } from "@/components/ui";

export type ShopItem = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  cost: number;
};

export function ShopCard({ item, balance }: { item: ShopItem; balance: number }) {
  const [state, formAction, isPending] = useActionState(redeemRewardAction, null);
  const [confirming, setConfirming] = useState(false);

  const affordable = balance >= item.cost;
  const missing = item.cost - balance;

  return (
    <article className={`fq-card-flat p-4 ${affordable ? "" : "opacity-75"}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] text-2xl">
          {item.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-bold leading-snug">{item.title}</h3>
            <Pill tone={affordable ? "mint" : "grey"}>{item.cost} коінів</Pill>
          </div>

          {item.description && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">{item.description}</p>
          )}
        </div>
      </div>

      {/* Коли не вистачає — показуємо, скільки лишилось назбирати.
          Це мотивує краще, ніж просто неактивна кнопка. */}
      {!affordable && (
        <div className="mt-3">
          <ProgressBar value={balance / item.cost} />
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">
            Ще {missing} {missing === 1 ? "коін" : missing < 5 ? "коіни" : "коінів"} — і можна
            обміняти.
          </p>
        </div>
      )}

      {affordable && (
        <div className="mt-3">
          {confirming ? (
            <form action={formAction} className="flex flex-col gap-2.5">
              <input type="hidden" name="rewardId" value={item.id} />
              <p className="text-sm text-[var(--color-muted)]">
                Спишемо {item.cost} коінів і надішлемо заявку батькам. Якщо вони не зможуть —
                коіни повернуться.
              </p>
              <input
                name="note"
                type="text"
                maxLength={200}
                className="fq-input"
                placeholder="Побажання — необов'язково"
              />
              <FormError message={state?.error} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="fq-btn fq-btn-ghost flex-1"
                  disabled={isPending}
                >
                  Передумав
                </button>
                <button type="submit" className="fq-btn fq-btn-primary flex-1" disabled={isPending}>
                  {isPending ? "Надсилаємо…" : "Так, обміняти"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="fq-btn fq-btn-quest"
              >
                Обміняти
              </button>
              <FormError message={state?.error} />
            </>
          )}
        </div>
      )}
    </article>
  );
}
