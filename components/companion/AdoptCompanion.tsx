"use client";

import { useActionState, useState } from "react";

import { adoptCompanionAction } from "@/app/actions/companion";
import { SPECIES } from "@/lib/companion/catalog";
import { companionSprite } from "@/lib/companion/sprites";
import { FormError } from "@/components/ui";

/** Перший екран: обрати вид і дати ім'я. Змінити вид потім не можна — */
/* прив'язаність до одного улюбленця сильніша за колекцію. */
export function AdoptCompanion() {
  const [state, formAction, isPending] = useActionState(adoptCompanionAction, null);
  const [species, setSpecies] = useState<string>(SPECIES[0].id);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="species" value={species} />

      <div className="grid grid-cols-3 gap-2.5">
        {SPECIES.map((option) => {
          const sprite = companionSprite(option.id, false);
          const active = species === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSpecies(option.id)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-2 rounded-[var(--radius-inner)] border-2 px-2 py-4 transition-colors ${
                active
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                  : "border-[var(--color-line-strong)] hover:bg-[var(--color-slate-soft)]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- піксель-арт */}
              <img
                src={sprite.src}
                alt=""
                aria-hidden="true"
                className="fq-pixel w-16"
                draggable={false}
              />
              <span className="text-sm font-bold">{option.name}</span>
              <span className="text-xs leading-tight text-[var(--color-muted)]">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <label className="fq-label" htmlFor="companion-name">
          Як його звати?
        </label>
        <input
          id="companion-name"
          name="name"
          required
          minLength={2}
          maxLength={20}
          className="fq-input"
          placeholder="Мурчик"
        />
      </div>

      <FormError message={state?.error} />

      <button type="submit" className="fq-btn fq-btn-primary" disabled={isPending}>
        {isPending ? "Знайомимось…" : "Це мій улюбленець!"}
      </button>
    </form>
  );
}
