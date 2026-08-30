"use client";

import { useActionState, useState } from "react";

import { loginAction } from "@/app/actions/auth";
import { FormError } from "@/components/ui";

type Mode = "parent" | "child";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("parent");
  const [state, formAction, isPending] = useActionState(loginAction, null);

  const isParent = mode === "parent";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Батьки заходять за email, діти — за коротким логіном, який дали батьки. */}
      <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-[var(--color-slate-soft)] p-1">
        {(["parent", "child"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-[9px] px-3 py-2 text-sm font-bold transition-colors ${
              mode === value
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm"
                : "text-[var(--color-muted)]"
            }`}
          >
            {value === "parent" ? "Я батько/мама" : "Я дитина"}
          </button>
        ))}
      </div>

      <input type="hidden" name="mode" value={mode} />

      <div>
        <label className="fq-label" htmlFor="identifier">
          {isParent ? "Email" : "Логін"}
        </label>
        <input
          id="identifier"
          name="identifier"
          type={isParent ? "email" : "text"}
          autoComplete={isParent ? "email" : "username"}
          autoCapitalize="none"
          spellCheck={false}
          required
          className="fq-input"
          placeholder={isParent ? "mama@example.com" : "eva"}
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
          autoComplete="current-password"
          required
          className="fq-input"
          placeholder="••••••"
        />
      </div>

      <FormError message={state?.error} />

      <button type="submit" className="fq-btn fq-btn-primary w-full" disabled={isPending}>
        {isPending ? "Заходимо…" : "Увійти"}
      </button>
    </form>
  );
}
