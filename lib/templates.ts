import "server-only";

import { prisma } from "./prisma";
import { parseWeekdays } from "./domain";

/** Локальна дата у форматі «YYYY-MM-DD» — ключ дня для екземплярів. */
export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Час «HH:mm» у конкретну дату. */
function withTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours || 0, minutes || 0, 0, 0);
  return result;
}

/**
 * Створює екземпляри повторюваних завдань на сьогодні.
 * Викликається при відкритті застосунку — окремого планувальника немає,
 * і для сімейного застосунку він і не потрібен.
 *
 * Пропущені дні НЕ добираються: якщо застосунок не відкривали три дні,
 * дитина не має отримати три прострочені «почистити зуби» одночасно.
 */
export async function generateTodayTasks(familyId: string): Promise<void> {
  const now = new Date();
  const today = dayKey(now);
  const weekday = now.getDay();

  const templates = await prisma.taskTemplate.findMany({
    where: {
      familyId,
      isPaused: false,
      // Уже згенеровані сьогодні шаблони пропускаємо без запиту до Task.
      OR: [{ lastGeneratedOn: null }, { lastGeneratedOn: { not: today } }],
    },
  });

  if (templates.length === 0) return;

  const dueToday = templates.filter((template) =>
    parseWeekdays(template.weekdays).includes(weekday),
  );

  // Шаблони, у яких сьогодні «вихідний», теж позначаємо обробленими,
  // щоб не перебирати їх при кожному відкритті сторінки.
  const skipped = templates.filter((template) => !dueToday.includes(template));
  if (skipped.length > 0) {
    await prisma.taskTemplate.updateMany({
      where: { id: { in: skipped.map((t) => t.id) } },
      data: { lastGeneratedOn: today },
    });
  }

  for (const template of dueToday) {
    try {
      await prisma.task.create({
        data: {
          familyId,
          childId: template.childId,
          templateId: template.id,
          occurrenceDate: today,
          title: template.title,
          description: template.description,
          dueAt: withTime(now, template.dueTime),
          xpReward: template.xpReward,
          coinReward: template.coinReward,
          autoApprove: template.autoApprove,
          status: "ACTIVE",
        },
      });
    } catch {
      // Унікальний ключ (templateId, occurrenceDate) захищає від дубля,
      // якщо застосунок відкрили одночасно з двох пристроїв.
    }

    await prisma.taskTemplate.update({
      where: { id: template.id },
      data: { lastGeneratedOn: today },
    });
  }
}
