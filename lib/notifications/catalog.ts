// Каталог типів сповіщень.
//
// Тип зберігається в базі рядком — так само, як статуси завдань. Усе
// решта про нього (емодзі, категорія) живе тут, а не в базі: інакше
// зміна емодзі вимагала б переписувати старі рядки.
//
// Додати новий тип = один запис тут плюс виклик notify(). Ні міграції,
// ні змін у центрі сповіщень не потрібно.

/** Категорії для майбутнього екрана «Налаштування → Сповіщення». */
export type NotificationCategory =
  | "TASKS"
  | "REMINDERS"
  | "RESULTS"
  | "REWARDS"
  | "NEWS"
  | "IMPORTANT";

export type NotificationKind = {
  emoji: string;
  category: NotificationCategory;
};

export const NOTIFICATION_KINDS: Record<string, NotificationKind> = {
  /* --- Життєвий цикл завдання --- */

  /** Батьки створили разове завдання для дитини. → дитині */
  TASK_ASSIGNED: { emoji: "🎯", category: "TASKS" },
  /** До дедлайну лишилась приблизно година. → дитині */
  TASK_DUE_SOON: { emoji: "⏰", category: "REMINDERS" },
  /** Дедлайн минув, а завдання не виконане. → дитині */
  TASK_OVERDUE: { emoji: "⌛", category: "REMINDERS" },
  /** Дитина подала завдання на перевірку. → усім батькам родини */
  TASK_SUBMITTED: { emoji: "✅", category: "RESULTS" },
  /** Батьки підтвердили виконання. → дитині */
  TASK_APPROVED: { emoji: "🎉", category: "RESULTS" },
  /** Батьки повернули на доопрацювання. → дитині */
  TASK_REJECTED: { emoji: "↩️", category: "RESULTS" },

  /* --- Магазин винагород --- */

  /** Дитина замовила нагороду за коіни. → усім батькам родини */
  REWARD_REQUESTED: { emoji: "🎁", category: "REWARDS" },
  /** Батьки позначили нагороду виданою. → дитині */
  REWARD_FULFILLED: { emoji: "🎁", category: "REWARDS" },
  /** Батьки відмовили, коіни повернулись. → дитині */
  REWARD_DECLINED: { emoji: "↩️", category: "REWARDS" },
};

/**
 * Категорії новин про сам FamilyQuest. Лежать поруч із типами сповіщень
 * навмисно: у центрі вони показуються одним списком, тож і правила
 * оформлення мають бути в одному місці.
 */
export const ANNOUNCEMENT_KINDS: Record<string, NotificationKind> = {
  /** Нова функція. */
  FEATURE: { emoji: "🚀", category: "NEWS" },
  /** Виправлення помилки. */
  FIX: { emoji: "🛠", category: "NEWS" },
  /** Покращення наявного. */
  UPDATE: { emoji: "✨", category: "NEWS" },
  /** Важливе системне повідомлення. */
  IMPORTANT: { emoji: "⚠️", category: "IMPORTANT" },
};

/** Невідомий тип не ламає список: показуємо нейтральний дзвіночок. */
export function kindOf(type: string): NotificationKind {
  return NOTIFICATION_KINDS[type] ?? { emoji: "🔔", category: "TASKS" };
}

/** Емодзі для елемента стрічки — байдуже, сповіщення це чи новина. */
export function feedEmoji(kind: "notification" | "announcement", type: string): string {
  if (kind === "announcement") return ANNOUNCEMENT_KINDS[type]?.emoji ?? "📣";
  return kindOf(type).emoji;
}
