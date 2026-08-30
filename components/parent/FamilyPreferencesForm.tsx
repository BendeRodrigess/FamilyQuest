"use client";

import { useActionState } from "react";

import { updateFamilyPreferencesAction } from "@/app/actions/family";
import { FormError } from "@/components/ui";

const GRACE_PRESETS = [15, 30, 60, 120];

export function FamilyPreferencesForm({
  showSiblingProgress,
  overdueGraceMinutes,
}: {
  showSiblingProgress: boolean;
  overdueGraceMinutes: number;
}) {
  const [state, formAction, isPending] = useActionState(updateFamilyPreferencesAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="fq-card-flat flex cursor-pointer items-start gap-3 p-4">
        <input
          type="checkbox"
          name="showSiblingProgress"
          defaultChecked={showSiblingProgress}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand)]"
        />
        <span>
          <span className="block font-bold">Діти бачать прогрес одне одного</span>
          <span className="block text-sm text-[var(--color-muted)]">
            Рівень, XP і кількість виконаних квестів — без коінів. Якщо різниця у віці
            велика й молодшого це радше засмучує, вимкни.
          </span>
        </span>
      </label>

      <div>
        <label className="fq-label" htmlFor="overdueGraceMinutes">
          Скільки живе прострочений квест
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="overdueGraceMinutes"
            name="overdueGraceMinutes"
            type="number"
            min={5}
            max={1440}
            defaultValue={overdueGraceMinutes}
            required
            className="fq-input w-28"
          />
          <span className="text-sm text-[var(--color-muted)]">хвилин</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {GRACE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                const field = document.getElementById(
                  "overdueGraceMinutes",
                ) as HTMLInputElement | null;
                if (field) field.value = String(preset);
              }}
              className="fq-pill fq-pill-grey cursor-pointer px-3 py-1.5"
            >
              {preset} хв
            </button>
          ))}
        </div>

        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Після дедлайну квест ще стільки часу видно з таймером зворотного відліку, а потім
          зникає з екрана дитини. У вас в історії він лишається як «Втрачений».
        </p>
      </div>

      <FormError message={state?.error} />
      {state?.success && (
        <p className="text-sm font-medium text-[var(--color-green-ink)]">{state.success}</p>
      )}

      <div>
        <button type="submit" className="fq-btn fq-btn-primary" disabled={isPending}>
          {isPending ? "Зберігаємо…" : "Зберегти"}
        </button>
      </div>
    </form>
  );
}
