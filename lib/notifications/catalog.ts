// Каталог типів сповіщень.
//
// Тип зберігається в базі рядком — так само, як статуси завдань. Усе
// решта про нього (емодзі, категорія) живе тут, а не в базі: інакше
// зміна емодзі вимагала б переписувати старі рядки.
//
// Додати новий тип = один запис тут плюс виклик notify(). Ні міграції,
// ні змін у центрі сповіщень не потрібно.

/** Категорії для майбутнього екрана «Налаштування → Сповіщення». */
export type NotificationCategory = "TASKS" | "REMINDERS" | "RESULTS" | "NEWS" | "IMPORTANT";

export type NotificationKind = {
  emoji: string;
  category: NotificationCategory;
};

export const NOTIFICATION_KINDS: Record<string, NotificationKind> = {
  /** Батьки створили разове завдання для дитини. */
  TASK_ASSIGNED: { emoji: "🎯", category: "TASKS" },
};

/** Невідомий тип не ламає список: показуємо нейтральний дзвіночок. */
export function kindOf(type: string): NotificationKind {
  return NOTIFICATION_KINDS[type] ?? { emoji: "🔔", category: "TASKS" };
}
