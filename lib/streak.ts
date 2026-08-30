import "server-only";

import { prisma } from "./prisma";
import { dayKey } from "./templates";

/**
 * Серія виконань — скільки днів поспіль дитина має хоча б одне
 * зараховане завдання.
 *
 * Серія не обривається протягом сьогоднішнього дня: якщо востаннє
 * зараховували вчора, серія ще жива, і сьогодні її можна продовжити.
 * Обривається вона лише тоді, коли пропущено цілий день.
 *
 * Рахуємо на льоту з журналу нарахувань — окреме поле в базі
 * рано чи пізно розійшлося б із реальністю.
 */
export async function currentStreak(childId: string, now: Date = new Date()): Promise<number> {
  // Двох місяців вистачає: довші серії в сімейному застосунку — рідкість,
  // а запит лишається дешевим.
  const since = new Date(now.getTime() - 62 * 24 * 60 * 60 * 1000);

  const entries = await prisma.ledgerEntry.findMany({
    where: {
      childId,
      kind: "XP",
      reason: "TASK_APPROVED",
      createdAt: { gte: since },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  if (entries.length === 0) return 0;

  const days = new Set(entries.map((entry) => dayKey(entry.createdAt)));

  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  // Якщо сьогодні ще нічого не зараховано, починаємо відлік із учора.
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/** «4 дні», «1 день», «11 днів». */
export function streakLabel(days: number): string {
  const lastTwo = days % 100;
  const last = days % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return `${days} днів`;
  if (last === 1) return `${days} день`;
  if (last >= 2 && last <= 4) return `${days} дні`;
  return `${days} днів`;
}
