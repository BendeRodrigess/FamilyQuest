"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import { DEFAULT_THEME, THEME_STORAGE_KEY, type Theme, isTheme } from "@/lib/theme";

type ThemeContextValue = {
  /** Що обрав користувач: «system» | «light» | «dark». */
  theme: Theme;
  /** Що фактично показано зараз — «system» уже розгорнуто у справжню тему. */
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ---------- Збережений вибір як зовнішнє сховище ---------- */

// localStorage живе поза React, тому читаємо його через useSyncExternalStore:
// так значення не «блимає» після гідратації й синхронізується між вкладками.
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribeToChoice(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readChoice(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    // приватний режим або заблоковане сховище
    return DEFAULT_THEME;
  }
}

/* ---------- Системне налаштування як зовнішнє сховище ---------- */

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeToSystem(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function readSystem(): "light" | "dark" {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/* ---------- Провайдер ---------- */

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === "system") {
    // Без атрибута вмикається медіазапит prefers-color-scheme із globals.css.
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToChoice, readChoice, () => DEFAULT_THEME);
  const systemPreference = useSyncExternalStore(
    subscribeToSystem,
    readSystem,
    () => "light" as const,
  );

  const resolvedTheme = theme === "system" ? systemPreference : theme;

  // Тримає атрибут на <html> в актуальному стані — зокрема коли тему
  // змінили в іншій вкладці й прилетіла подія storage.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // вибір застосується, але не переживе перезавантаження
    }

    applyTheme(next);
    notify();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme треба викликати всередині ThemeProvider.");
  }
  return context;
}
