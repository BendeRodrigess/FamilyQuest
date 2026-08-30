"use client";

import { useTheme } from "./ThemeProvider";
import { THEMES, THEME_LABEL, type Theme } from "@/lib/theme";
import { IconMonitor, IconMoon, IconSun } from "@/components/icons";

const ICONS: Record<Theme, typeof IconSun> = {
  system: IconMonitor,
  light: IconSun,
  dark: IconMoon,
};

/** Повний вибір теми для розділу налаштувань. */
export function ThemeChoice() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((value) => {
          const Icon = ICONS[value];
          const active = theme === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-2 rounded-[var(--radius-inner)] border px-3 py-4 text-sm font-semibold transition-colors ${
                active
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-ink)]"
                  : "border-[var(--color-line-strong)] text-[var(--color-ink-soft)] hover:bg-[var(--color-slate-soft)]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {THEME_LABEL[value]}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-[var(--color-muted)]">
        Вибір зберігається на цьому пристрої. У режимі «як у системі» тема змінюється разом
        із налаштуванням телефона або комп&apos;ютера.
      </p>
    </div>
  );
}
