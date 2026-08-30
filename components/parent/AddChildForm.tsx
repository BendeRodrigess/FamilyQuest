"use client";

import { useActionState, useState } from "react";

import { addChildAction } from "@/app/actions/children";
import { FormError } from "@/components/ui";
import { IconPlus } from "@/components/icons";

/** Проста транслітерація імені в логін — щоб батькам не вигадувати його самим. */
function suggestUsername(name: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
    з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
    о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia",
  };

  // На початку слова ці літери передаються інакше: Єва → yeva, а не ieva.
  const initial: Record<string, string> = {
    є: "ye", ю: "yu", я: "ya", ї: "yi", й: "y",
  };

  return name
    .trim()
    .toLowerCase()
    .split("")
    .map((char, index) => (index === 0 ? (initial[char] ?? map[char] ?? char) : (map[char] ?? char)))
    .join("")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 20);
}

export function AddChildForm() {
  const [state, formAction, isPending] = useActionState(addChildAction, null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!usernameTouched) setUsername(suggestUsername(value));
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="fq-btn fq-btn-primary">
        <IconPlus className="h-[1.15rem] w-[1.15rem]" />
        Додати дитину
      </button>
    );
  }

  return (
    <form action={formAction} className="fq-card-flat flex flex-col gap-4 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="fq-label" htmlFor="child-name">
            Ім&apos;я дитини
          </label>
          <input
            id="child-name"
            name="displayName"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            required
            className="fq-input"
            placeholder="Єва"
          />
        </div>

        <div>
          <label className="fq-label" htmlFor="child-username">
            Логін для входу
          </label>
          <input
            id="child-username"
            name="username"
            value={username}
            onChange={(event) => {
              setUsernameTouched(true);
              setUsername(event.target.value);
            }}
            required
            autoCapitalize="none"
            spellCheck={false}
            className="fq-input"
            placeholder="eva"
          />
        </div>
      </div>

      <div>
        <label className="fq-label" htmlFor="child-password">
          Пароль
        </label>
        <input
          id="child-password"
          name="password"
          type="text"
          required
          minLength={4}
          className="fq-input"
          placeholder="Придумай простий пароль"
        />
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          Запам&apos;ятай його й передай дитині. Пізніше побачити його вже не вийде — але ти
          завжди зможеш задати новий.
        </p>
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
          {isPending ? "Додаємо…" : "Додати дитину"}
        </button>
      </div>
    </form>
  );
}
