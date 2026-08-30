"use client";

import { useActionState, useState } from "react";

import { changeOwnPasswordAction } from "@/app/actions/auth";
import { FormError } from "@/components/ui";
import { IconKey } from "@/components/icons";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changeOwnPasswordAction, null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="fq-btn fq-btn-outline">
        <IconKey className="h-[1.15rem] w-[1.15rem]" />
        Змінити пароль
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="fq-label" htmlFor="currentPassword">
          Поточний пароль
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="fq-input"
        />
      </div>

      <div>
        <label className="fq-label" htmlFor="newPassword">
          Новий пароль
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={4}
          className="fq-input"
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
          {isPending ? "Зберігаємо…" : "Зберегти"}
        </button>
      </div>
    </form>
  );
}
