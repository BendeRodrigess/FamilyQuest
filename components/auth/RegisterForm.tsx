"use client";

import { useActionState } from "react";

import { registerParentAction } from "@/app/actions/auth";
import { FormError } from "@/components/ui";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerParentAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="fq-label" htmlFor="displayName">
          Як тебе звати
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          className="fq-input"
          placeholder="Данило"
        />
      </div>

      <div>
        <label className="fq-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          className="fq-input"
          placeholder="tato@example.com"
        />
      </div>

      <div>
        <label className="fq-label" htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="fq-input"
          placeholder="Щонайменше 6 символів"
        />
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          Це спільний акаунт батьків — під ним заходять і тато, і мама, і бабуся.
        </p>
      </div>

      <FormError message={state?.error} />

      <button type="submit" className="fq-btn fq-btn-primary w-full" disabled={isPending}>
        {isPending ? "Створюємо…" : "Створити сім'ю"}
      </button>
    </form>
  );
}
