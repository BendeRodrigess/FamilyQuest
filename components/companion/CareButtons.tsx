"use client";

import { useActionState } from "react";

import { careAction } from "@/app/actions/companion";
import { CARE_ACTIONS, NEED_MAX, type Needs } from "@/lib/companion/state";
import { FormError } from "@/components/ui";

const VISUALS = {
  feed: { emoji: "🍖", tone: "#e2f3ea" },
  play: { emoji: "🎾", tone: "#fceace" },
  sleep: { emoji: "🌙", tone: "#e2eefb" },
} as const;

/**
 * Три великі кнопки догляду. Кожна коштує одну зірочку, яку дає
 * підтверджене завдання — тому без виконаних справ подбати не вийде.
 */
export function CareButtons({ needs, careStars }: { needs: Needs; careStars: number }) {
  const [state, formAction, isPending] = useActionState(careAction, null);

  const canCare = careStars > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2.5">
        {CARE_ACTIONS.map((action) => {
          const visual = VISUALS[action.id];
          const full = needs[action.need] >= NEED_MAX;
          const disabled = isPending || !canCare || full;

          return (
            <form key={action.id} action={formAction}>
              <input type="hidden" name="action" value={action.id} />
              <button
                type="submit"
                disabled={disabled}
                title={full ? "Уже повністю" : action.label}
                className="flex w-full flex-col items-center gap-1.5 rounded-[var(--radius-inner)] border-2 border-[var(--color-line-strong)] px-2 py-3.5 font-bold transition-colors hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--color-line-strong)]"
                style={{ background: visual.tone }}
              >
                <span className="text-2xl" aria-hidden="true">
                  {visual.emoji}
                </span>
                <span className="text-sm text-[#2b2338]">{action.label}</span>
              </button>
            </form>
          );
        })}
      </div>

      <FormError message={state?.error} />

      {state?.success && (
        <p className="rounded-[var(--radius-control)] bg-[var(--color-green-soft)] px-3 py-2 text-center text-sm font-bold text-[var(--color-green-ink)]">
          {state.success}
        </p>
      )}

      <p className="text-center text-sm text-[var(--color-muted)]">
        {canCare ? (
          <>
            У тебе <span className="font-bold text-[var(--color-ink)]">⭐ {careStars}</span> —
            кожна дія витрачає одну
          </>
        ) : (
          <>Зірочки закінчились. Виконай квест — і зможеш подбати про улюбленця</>
        )}
      </p>
    </div>
  );
}
