"use client";

import { useActionState } from "react";

import { renameFamilyAction } from "@/app/actions/family";
import { FormError } from "@/components/ui";

export function FamilyNameForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, isPending] = useActionState(renameFamilyAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <label className="fq-label" htmlFor="family-name">
        Назва сім&apos;ї
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="family-name"
          name="name"
          defaultValue={defaultName}
          required
          maxLength={60}
          className="fq-input flex-1"
        />
        <button type="submit" className="fq-btn fq-btn-outline" disabled={isPending}>
          {isPending ? "Зберігаємо…" : "Зберегти"}
        </button>
      </div>

      <FormError message={state?.error} />
      {state?.success && (
        <p className="text-sm font-medium text-[var(--color-green-ink)]">{state.success}</p>
      )}
    </form>
  );
}
