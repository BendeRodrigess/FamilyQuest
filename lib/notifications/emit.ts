import "server-only";

import { prisma } from "../prisma";
import { pushToUser } from "../push";
import { kindOf } from "./catalog";

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

/**
 * Що сталося зі спробою створити сповіщення. Потрібно фоновому job'у:
 * «дубль» для нього — нормальний результат, а не збій, і в логах вони
 * мають рахуватися окремо від справжніх помилок.
 */
export type NotifyResult = "created" | "duplicate" | "failed";

export async function notify(input: NotifyInput): Promise<NotifyResult> {
  const result = await createRow(input);

  // Push надсилається лише при справжньому створенні рядка — і поза
  // блоком, що визначає результат. Тому повторне відкриття центру,
  // перерендер сторінки чи другий запуск фонового job'а нікому нічого
  // не надішлють: на дублі сюди просто не доходить.
  //
  // Виклик не може зіпсувати результат: pushToUser за контрактом не
  // кидає помилок, а основна операція — нарахування XP, створення
  // завдання — не повинна залежати від доступності push-сервісу.
  if (result === "created") {
    await pushToUser(input.userId, {
      title: `${kindOf(input.type).emoji} ${input.title}`,
      body: input.body,
      href: input.href ?? null,
      tag: input.type,
    });
  }

  return result;
}

async function createRow(input: NotifyInput): Promise<NotifyResult> {
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

    return "created";
  } catch (error) {
    // Таке сповіщення вже є — нормальна ситуація, а не збій.
    if (isDuplicate(error)) return "duplicate";

    // Сповіщення другорядне: якщо воно не створилось, завдання все одно
    // має бути створене, і батьки не повинні бачити помилку. Але мовчки
    // ковтати причину не можна — інакше зламані сповіщення ніхто не
    // помітить. У продакшені це потрапляє в journald разом із рештою логів.
    console.error("notify:", error);
    return "failed";
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
