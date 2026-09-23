import "server-only";

import { prisma } from "./prisma";
import { parseWeekdays } from "./domain";
import { dayKeyIn, wallClockToInstant, weekdayIn } from "./time";

/**
 * Створює екземпляри повторюваних завдань на сьогодні.
 * Викликається при відкритті застосунку — окремого планувальника немає,
 * і для сімейного застосунку він і не потрібен.
 *
 * Пропущені дні НЕ добираються: якщо застосунок не відкривали три дні,
 * дитина не має отримати три прострочені «почистити зуби» одночасно.
 *
 * Доба й час рахуються за зоною **дитини**, а не сервера: «щодня до 20:00»
 * означає 20:00 на годиннику дитини. Через це «сьогодні» в кожної дитини
 * своє, тож відфільтрувати вже згенероване одним запитом не вийде —
 * шаблонів у родині одиниці, тому розбираємо їх у пам'яті.
 */
export async function generateTodayTasks(familyId: string): Promise<void> {
  const now = new Date();

  const templates = await prisma.taskTemplate.findMany({
    where: { familyId, isPaused: false },
    include: { child: { select: { timeZone: true } } },
  });

  if (templates.length === 0) return;

  const due: { template: (typeof templates)[number]; day: string }[] = [];
  // Шаблони, у яких сьогодні «вихідний», теж позначаємо обробленими,
  // щоб не перебирати їх при кожному відкритті сторінки.
  const restingByDay = new Map<string, string[]>();

  for (const template of templates) {
    const zone = template.child.timeZone;
    const day = dayKeyIn(now, zone);

    if (template.lastGeneratedOn === day) continue;

    if (parseWeekdays(template.weekdays).includes(weekdayIn(now, zone))) {
      due.push({ template, day });
    } else {
      restingByDay.set(day, [...(restingByDay.get(day) ?? []), template.id]);
    }
  }

  for (const [day, ids] of restingByDay) {
    await prisma.taskTemplate.updateMany({
      where: { id: { in: ids } },
      data: { lastGeneratedOn: day },
    });
  }

  for (const { template, day } of due) {
    try {
      await prisma.task.create({
        data: {
          familyId,
          childId: template.childId,
          templateId: template.id,
          occurrenceDate: day,
          title: template.title,
          description: template.description,
          dueAt: wallClockToInstant(day, template.dueTime, template.child.timeZone),
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
      data: { lastGeneratedOn: day },
    });
  }
}
