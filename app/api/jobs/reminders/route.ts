import { timingSafeEqual } from "node:crypto";

import { runReminders } from "@/lib/jobs/reminders";

/**
 * Вхід для фонового job'а нагадувань.
 *
 * Його викликає systemd-таймер на самому сервері, а не браузер. Окремий
 * процес для цього не потрібен: усе — Prisma, змінні оточення, логіка
 * статусів — уже є всередині застосунку.
 *
 * Nginx проксіює на застосунок усе з кореня, тож формально адреса видна
 * ззовні. Захищає спільний секрет із /etc/familyquest/env: без нього
 * відповідь завжди 401, і job неможливо запустити з інтернету.
 */

// Job має виконуватись при кожному виклику, без кешування відповіді.
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env["JOB_SECRET"];

  // Секрет не заданий — вважаємо, що job вимкнений. Тиха відмова
  // безпечніша за випадково відкритий ендпойнт.
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  const given = Buffer.from(token);
  const expected = Buffer.from(secret);

  // Порівнюємо за сталий час; різну довжину timingSafeEqual не приймає.
  if (given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return Response.json({ error: "Немає доступу." }, { status: 401 });
  }

  try {
    const summary = await runReminders();
    return Response.json(summary);
  } catch (error) {
    console.error("[jobs/reminders] запуск завершився помилкою:", error);
    return Response.json({ error: "Job завершився помилкою." }, { status: 500 });
  }
}
