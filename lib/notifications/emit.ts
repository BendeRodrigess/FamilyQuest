import "server-only";

import { prisma } from "../prisma";

/**
 * Єдина точка створення сповіщень — за зразком creditTask(), який так само
 * є єдиним місцем нарахування XP і коінів.
 *
 * Коли додамо Web Push, надсилання стане саме тут: спочатку сповіщення
 * з'являється в системі, і лише потім про нього повідомляють назовні.
 * Тому жодна сторінка не створює рядки Notification напряму.
 */

export type NotifyInput = {
  /** Адресат. Завжди визначається на сервері, ніколи не приходить із клієнта. */
  userId: string;
  /** Тип із lib/notifications/catalog.ts. */
  type: string;
  /** Без емодзі — його дає каталог за типом. */
  title: string;
  body: string;
  /** Внутрішній маршрут, куди веде натискання. */
  href?: string | null;
  taskId?: string | null;
  /**
   * Ключ ідемпотентності для подій, які може згенерувати повторний запуск:
   * нагадування за годину до дедлайну, прострочення. Разові події
   * (створення завдання) ключа не потребують.
   */
  dedupeKey?: string | null;
};

export async function notify(input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        taskId: input.taskId ?? null,
        dedupeKey: input.dedupeKey ?? null,
      },
    });
  } catch (error) {
    // Таке сповіщення вже є — нормальна ситуація, а не збій.
    if (isDuplicate(error)) return;

    // Сповіщення другорядне: якщо воно не створилось, завдання все одно
    // має бути створене, і батьки не повинні бачити помилку. Але мовчки
    // ковтати причину не можна — інакше зламані сповіщення ніхто не
    // помітить. У продакшені це потрапляє в journald разом із рештою логів.
    console.error("notify:", error);
  }
}

/** P2002 — порушення унікальності dedupeKey. */
function isDuplicate(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}
