// Рівні: щоб перейти з рівня N на N+1, потрібно 100 + (N-1) * 50 XP.
// Перші рівні даються швидко, далі поріг плавно зростає.
// XP ніколи не витрачається — рівень обчислюється з накопиченої суми.

export const BASE_XP = 100;
export const XP_STEP = 50;
const MAX_LEVEL = 999;

/** Скільки XP треба набрати, перебуваючи на рівні `level`, щоб перейти на наступний. */
export function xpToAdvanceFrom(level: number): number {
  return BASE_XP + (level - 1) * XP_STEP;
}

export type LevelInfo = {
  level: number;
  /** XP, набрані в межах поточного рівня. */
  xpIntoLevel: number;
  /** Скільки XP потрібно для переходу на наступний рівень. */
  xpForNextLevel: number;
  /** Частка заповнення смуги прогресу, 0..1. */
  progress: number;
};

export function levelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let consumed = 0;

  while (level < MAX_LEVEL) {
    const need = xpToAdvanceFrom(level);
    if (xp - consumed < need) break;
    consumed += need;
    level += 1;
  }

  const xpForNextLevel = xpToAdvanceFrom(level);
  const xpIntoLevel = xp - consumed;

  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progress: xpForNextLevel > 0 ? Math.min(1, xpIntoLevel / xpForNextLevel) : 0,
  };
}
