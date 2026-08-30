// Спільні типи та константи предметної області.

export const ROLES = ["PARENT", "CHILD"] as const;
export type Role = (typeof ROLES)[number];

export const TASK_STATUSES = [
  "ACTIVE",
  "PENDING_REVIEW",
  "DONE",
  "REJECTED",
  "OVERDUE",
  "LOST",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  ACTIVE: "Активне",
  PENDING_REVIEW: "Очікує перевірки",
  DONE: "Виконане",
  REJECTED: "Відхилене",
  OVERDUE: "Прострочене",
  LOST: "Втрачене",
};

/** Тон плашки статусу — відповідає палітрі в globals.css. */
export const TASK_STATUS_TONE: Record<TaskStatus, "lilac" | "amber" | "green" | "rose" | "grey"> = {
  ACTIVE: "lilac",
  PENDING_REVIEW: "amber",
  DONE: "green",
  REJECTED: "rose",
  OVERDUE: "amber",
  LOST: "grey",
};

export const LEDGER_KINDS = ["XP", "COIN"] as const;
export type LedgerKind = (typeof LEDGER_KINDS)[number];

export const LEDGER_REASONS = [
  "TASK_APPROVED",
  "PAYOUT",
  "REWARD_REDEEMED",
  "REWARD_REFUNDED",
] as const;
export type LedgerReason = (typeof LEDGER_REASONS)[number];

/** Кольори аватарів дітей — циклічно призначаються при додаванні. */
export const AVATAR_COLORS = ["violet", "mint", "amber", "rose", "sky", "lime"] as const;
export type AvatarColor = (typeof AVATAR_COLORS)[number];

export const XP_MIN = 1;
export const XP_MAX = 500;
export const COIN_MIN = 0;
export const COIN_MAX = 10000;

/* ---------- Повторювані завдання ---------- */

/** Дні тижня в порядку українського календаря. Числа — як у Date.getDay(). */
export const WEEKDAYS = [
  { value: 1, short: "Пн", full: "понеділок" },
  { value: 2, short: "Вт", full: "вівторок" },
  { value: 3, short: "Ср", full: "середа" },
  { value: 4, short: "Чт", full: "четвер" },
  { value: 5, short: "Пт", full: "п'ятниця" },
  { value: 6, short: "Сб", full: "субота" },
  { value: 0, short: "Нд", full: "неділя" },
] as const;

export const EVERY_DAY = "0123456";

/** Рядок днів («135») у масив чисел, відсортований по-українськи: Пн…Нд. */
export function parseWeekdays(value: string): number[] {
  const set = new Set(
    value
      .split("")
      .map((char) => Number(char))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
  );
  return WEEKDAYS.filter((day) => set.has(day.value)).map((day) => day.value);
}

export function serializeWeekdays(days: number[]): string {
  return [...new Set(days)].sort((a, b) => a - b).join("");
}

/** «Щодня», «У будні», «На вихідних» або перелік: «Пн, Ср, Пт». */
export function describeWeekdays(value: string): string {
  const days = parseWeekdays(value);

  if (days.length === 0) return "Не налаштовано";
  if (days.length === 7) return "Щодня";

  const isWorkweek = days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d));
  if (isWorkweek) return "У будні";

  const isWeekend = days.length === 2 && days.includes(0) && days.includes(6);
  if (isWeekend) return "На вихідних";

  return WEEKDAYS.filter((day) => days.includes(day.value))
    .map((day) => day.short)
    .join(", ");
}

/* ---------- Магазин нагород ---------- */

export const REDEMPTION_STATUSES = ["PENDING", "FULFILLED", "DECLINED"] as const;
export type RedemptionStatus = (typeof REDEMPTION_STATUSES)[number];

export const REDEMPTION_STATUS_LABEL: Record<RedemptionStatus, string> = {
  PENDING: "Очікує видачі",
  FULFILLED: "Видано",
  DECLINED: "Відхилено",
};

export const REDEMPTION_STATUS_TONE: Record<RedemptionStatus, "amber" | "green" | "rose"> = {
  PENDING: "amber",
  FULFILLED: "green",
  DECLINED: "rose",
};

/** Набір емодзі для нагород — щоб вітрина не була стіною тексту. */
export const REWARD_EMOJI = [
  "🎁", "🎮", "🍦", "🎬", "🍕", "🛝", "🚲", "📚",
  "🧸", "⚽", "🎨", "🎧", "🌙", "🍿", "🎂", "🏊",
] as const;

export const REWARD_COST_MIN = 1;
export const REWARD_COST_MAX = 100000;
