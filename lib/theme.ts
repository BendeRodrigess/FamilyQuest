// Тема зберігається на пристрої, а не в акаунті: у дитини свій телефон,
// у батьків свій, і кожен вибирає під себе.

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "fq-theme";
export const DEFAULT_THEME: Theme = "system";

export const THEME_LABEL: Record<Theme, string> = {
  system: "Як у системі",
  light: "Світла",
  dark: "Темна",
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * Скрипт, який виконується до першого малювання сторінки.
 * Без нього застосунок на мить блимне світлою темою, перш ніж React
 * встигне застосувати збережений вибір.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {
    /* приватний режим або вимкнене сховище — лишається системна тема */
  }
})();
`.trim();
