"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createRewardAction, updateRewardAction } from "@/app/actions/shop";
import { REWARD_EMOJI } from "@/lib/domain";
import { FormError } from "@/components/ui";

export type RewardFormValues = {
  rewardId?: string;
  title: string;
  description: string;
  emoji: string;
  costCoins: number;
};

const COST_PRESETS = [20, 50, 100, 200];

export function RewardForm({
  values,
  mode,
}: {
  values: RewardFormValues;
  mode: "create" | "edit";
}) {
  const action = mode === "create" ? createRewardAction : updateRewardAction;
  const [state, formAction, isPending] = useActionState(action, null);
  const [emoji, setEmoji] = useState(values.emoji);
  const [cost, setCost] = useState(values.costCoins);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {values.rewardId && <input type="hidden" name="rewardId" value={values.rewardId} />}
      <input type="hidden" name="emoji" value={emoji} />

      <div>
        <label className="fq-label" htmlFor="title">
          Що це за нагорода
        </label>
        <input
          id="title"
          name="title"
          defaultValue={values.title}
          required
          maxLength={80}
          className="fq-input"
          placeholder="Година додаткових ігор"
        />
      </div>

      <div>
        <label className="fq-label" htmlFor="description">
          Умови <span className="font-normal text-[var(--color-muted)]">— необов&apos;язково</span>
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={values.description}
          rows={2}
          maxLength={300}
          className="fq-input resize-none"
          placeholder="Тільки на вихідних і після домашки"
        />
      </div>

      <div>
        <span className="fq-label">Значок</span>
        <div className="flex flex-wrap gap-1.5">
          {REWARD_EMOJI.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setEmoji(item)}
              aria-label={`Значок ${item}`}
              aria-pressed={emoji === item}
              className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border text-xl transition-colors ${
                emoji === item
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                  : "border-[var(--color-line-strong)] hover:bg-[var(--color-slate-soft)]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="fq-label" htmlFor="costCoins">
          Ціна в коінах
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="costCoins"
            name="costCoins"
            type="number"
            min={1}
            max={100000}
            value={cost}
            onChange={(event) => setCost(Number(event.target.value))}
            required
            className="fq-input w-28"
          />
          {COST_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setCost(preset)}
              className={`fq-pill cursor-pointer px-3 py-1.5 ${
                cost === preset ? "fq-pill-lilac" : "fq-pill-grey"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          Орієнтуйся на те, скільки коінів дитина заробляє за тиждень: нагорода має бути
          досяжною днів за п&apos;ять-сім, інакше вона перестає мотивувати.
        </p>
      </div>

      <FormError message={state?.error} />

      <div className="flex gap-2">
        <Link href="/parent/rewards?tab=shop" className="fq-btn fq-btn-ghost">
          Скасувати
        </Link>
        <button type="submit" className="fq-btn fq-btn-primary flex-1" disabled={isPending}>
          {isPending ? "Зберігаємо…" : mode === "create" ? "Додати нагороду" : "Зберегти"}
        </button>
      </div>
    </form>
  );
}
