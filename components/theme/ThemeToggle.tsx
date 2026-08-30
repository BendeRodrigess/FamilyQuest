"use client";

import { useTheme } from "./ThemeProvider";
import { IconMoon, IconSun } from "@/components/icons";

/**
 * Швидкий перемикач у шапці: одне натискання — і тема протилежна поточній.
 * Тонше налаштування (зокрема «як у системі») — у розділі налаштувань.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const goingDark = resolvedTheme === "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(goingDark ? "dark" : "light")}
      className="fq-btn fq-btn-ghost !px-2.5 !py-2"
      title={goingDark ? "Увімкнути темну тему" : "Увімкнути світлу тему"}
      aria-label={goingDark ? "Увімкнути темну тему" : "Увімкнути світлу тему"}
    >
      {goingDark ? (
        <IconMoon className="h-[1.15rem] w-[1.15rem]" />
      ) : (
        <IconSun className="h-[1.15rem] w-[1.15rem]" />
      )}
    </button>
  );
}
