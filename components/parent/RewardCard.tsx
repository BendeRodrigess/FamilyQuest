"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { deleteRewardAction, toggleRewardAction } from "@/app/actions/shop";
import { Pill } from "@/components/ui";
import { IconEdit, IconTrash } from "@/components/icons";

export type RewardSummary = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  costCoins: number;
  isActive: boolean;
  timesRedeemed: number;
};

export function RewardCard({ reward }: { reward: RewardSummary }) {
  const [toggleState, toggle, isToggling] = useActionState(toggleRewardAction, null);
  const [deleteState, remove, isDeleting] = useActionState(deleteRewardAction, null);
  const [confirming, setConfirming] = useState(false);

  const busy = isToggling || isDeleting;
  const error = toggleState?.error ?? deleteState?.error;

  return (
    <article className={`fq-card-flat p-4 ${reward.isActive ? "" : "opacity-60"}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] text-2xl">
          {reward.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold leading-snug">{reward.title}</h3>
            {!reward.isActive && <Pill tone="grey">Прихована</Pill>}
          </div>

          {reward.description && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">{reward.description}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <Pill tone="mint">{reward.costCoins} коінів</Pill>
            {reward.timesRedeemed > 0 && (
              <Pill tone="grey">обміняно {reward.timesRedeemed} р.</Pill>
            )}
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-[var(--color-rose-ink)]">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <form action={toggle}>
          <input type="hidden" name="rewardId" value={reward.id} />
          <button type="submit" className="fq-btn fq-btn-outline text-sm" disabled={busy}>
            {reward.isActive ? "Прибрати з вітрини" : "Повернути на вітрину"}
          </button>
        </form>

        <div className="flex items-center gap-1">
          <Link
            href={`/parent/rewards/${reward.id}/edit`}
            className="fq-btn fq-btn-ghost !px-2 !py-1.5"
            title="Редагувати"
            aria-label={`Редагувати «${reward.title}»`}
          >
            <IconEdit className="h-[1.15rem] w-[1.15rem]" />
          </Link>

          {confirming ? (
            <form action={remove} className="flex items-center gap-1.5">
              <input type="hidden" name="rewardId" value={reward.id} />
              <span className="text-xs text-[var(--color-muted)]">Видалити?</span>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="fq-btn fq-btn-ghost !px-2 !py-1.5 text-xs"
                disabled={busy}
              >
                Ні
              </button>
              <button
                type="submit"
                className="fq-btn fq-btn-outline !px-2.5 !py-1.5 text-xs"
                disabled={busy}
              >
                Так
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="fq-btn fq-btn-ghost !px-2 !py-1.5"
              title="Видалити"
              aria-label={`Видалити «${reward.title}»`}
            >
              <IconTrash className="h-[1.15rem] w-[1.15rem]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
