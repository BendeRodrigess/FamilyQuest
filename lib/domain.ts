// Спільні типи та константи предметної області.

export const ROLES = ["PARENT", "CHILD"] as const;
export type Role = (typeof ROLES)[number];

export const TASK_STATUSES = [
  "ACTIVE",
  "PENDING_REVIEW",
  "DONE",
  "REJECTED",
  "OVERDUE",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  ACTIVE: "Активне",
  PENDING_REVIEW: "Очікує перевірки",
  DONE: "Виконане",
  REJECTED: "Відхилене",
  OVERDUE: "Прострочене",
};

/** Тон плашки статусу — відповідає палітрі в globals.css. */
export const TASK_STATUS_TONE: Record<TaskStatus, "lilac" | "amber" | "green" | "rose" | "grey"> = {
  ACTIVE: "lilac",
  PENDING_REVIEW: "amber",
  DONE: "green",
  REJECTED: "rose",
  OVERDUE: "grey",
};

export const LEDGER_KINDS = ["XP", "COIN"] as const;
export type LedgerKind = (typeof LEDGER_KINDS)[number];

export const LEDGER_REASONS = ["TASK_APPROVED", "PAYOUT"] as const;
export type LedgerReason = (typeof LEDGER_REASONS)[number];

/** Кольори аватарів дітей — циклічно призначаються при додаванні. */
export const AVATAR_COLORS = ["violet", "mint", "amber", "rose", "sky", "lime"] as const;
export type AvatarColor = (typeof AVATAR_COLORS)[number];

export const XP_MIN = 1;
export const XP_MAX = 500;
export const COIN_MIN = 0;
export const COIN_MAX = 10000;
