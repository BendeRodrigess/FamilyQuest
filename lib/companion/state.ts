// Математика стану компаньйона.
//
// Свідомо чисті функції без бази й без React: баланс тут легко читати,
// міняти й перевіряти, не запускаючи застосунок.

export const NEED_MAX = 100;

/**
 * Нижня межа. Шкали ніколи не падають нижче — компаньйон не хворіє
 * й не помирає.
 *
 * Дитина може поїхати на тиждень до бабусі й повернутися: улюбленець
 * дрімає, але не страждає. Застосунок про домашні обов'язки не повинен
 * карати за життя поза застосунком.
 */
export const NEED_FLOOR = 15;

/** Спадання за годину. Ситість тане швидше — годувати треба частіше. */
export const DECAY_PER_HOUR = {
  fullness: 3,
  mood: 2,
  energy: 2,
} as const;

/** Скільки додає одна дія догляду. */
export const CARE_GAIN = 35;

/** Скільки зірочок коштує одна дія. */
export const CARE_COST = 1;

export type Needs = {
  fullness: number;
  mood: number;
  energy: number;
};

export type NeedKey = keyof Needs;

export const CARE_ACTIONS = [
  { id: "feed", need: "fullness", label: "Погодувати", done: "Смачно!" },
  { id: "play", need: "mood", label: "Погратись", done: "Ура, граємось!" },
  { id: "sleep", need: "energy", label: "Поспати", done: "Солодких снів" },
] as const;

export type CareAction = (typeof CARE_ACTIONS)[number]["id"];

export function needForAction(action: CareAction): NeedKey {
  return CARE_ACTIONS.find((a) => a.id === action)!.need;
}

function clamp(value: number): number {
  return Math.max(NEED_FLOOR, Math.min(NEED_MAX, Math.round(value)));
}

/** Стан шкал через певний час без догляду. */
export function decay(needs: Needs, since: Date, now: Date = new Date()): Needs {
  const hours = Math.max(0, (now.getTime() - since.getTime()) / 3_600_000);
  if (hours === 0) return { ...needs };

  return {
    fullness: clamp(needs.fullness - DECAY_PER_HOUR.fullness * hours),
    mood: clamp(needs.mood - DECAY_PER_HOUR.mood * hours),
    energy: clamp(needs.energy - DECAY_PER_HOUR.energy * hours),
  };
}

export function applyCare(needs: Needs, action: CareAction): Needs {
  const key = needForAction(action);
  return { ...needs, [key]: clamp(needs[key] + CARE_GAIN) };
}

/* ---------- Похідний настрій ---------- */

export const MOODS = ["happy", "calm", "bored", "sleepy"] as const;
export type Mood = (typeof MOODS)[number];

export const MOOD_LABEL: Record<Mood, string> = {
  happy: "Задоволений",
  calm: "Спокійний",
  bored: "Нудьгує",
  sleepy: "Дрімає",
};

/** Що компаньйон «каже» дитині — коротко й без докорів. */
export const MOOD_LINE: Record<Mood, string> = {
  happy: "Усе чудово! Давай ще щось зробимо разом.",
  calm: "Мені добре. Можеш зазирнути пізніше.",
  bored: "Трохи нудно… Пограємось, коли зможеш.",
  sleepy: "Я подрімаю, поки тебе немає. Повертайся!",
};

export function moodOf(needs: Needs): Mood {
  const average = (needs.fullness + needs.mood + needs.energy) / 3;
  if (average >= 75) return "happy";
  if (average >= 50) return "calm";
  if (average >= 30) return "bored";
  return "sleepy";
}

/** Яка шкала просіла найсильніше — щоб підказати дитині потрібну дію. */
export function weakestNeed(needs: Needs): NeedKey {
  const entries: [NeedKey, number][] = [
    ["fullness", needs.fullness],
    ["mood", needs.mood],
    ["energy", needs.energy],
  ];
  return entries.sort((a, b) => a[1] - b[1])[0][0];
}

export const NEED_LABEL: Record<NeedKey, string> = {
  fullness: "Ситість",
  mood: "Настрій",
  energy: "Енергія",
};
