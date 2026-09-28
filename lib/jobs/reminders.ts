import "server-only";

import { prisma } from "../prisma";
import { formatSubmittedLabel, formatTimeLeft } from "../format";
import { notify } from "../notifications/emit";
import { syncTaskStatuses } from "../tasks";

/**
 * Фонові нагадування про дедлайни.
 *
 * Запускається systemd-таймером приблизно раз на 5 хвилин і не залежить
 * від того, чи відкривав хтось застосунок. Це й відрізняє його від
 * `syncTaskStatuses` у лейаутах: там статуси оновлюються лише коли хтось
 * зайшов, тут — завжди.
 */

/** За скільки до дедлайну нагадуємо. */
const DUE_SOON_MINUTES = 60;

/**
 * Наскільки старе прострочення ще варте сповіщення.
 *
 * Без межі перший запуск написав би дитині про кожне завдання, втрачене
 * місяць тому. Шість годин — це запас, який переживає і перезавантаження
 * сервера, і деплой, але не воскрешає історію.
 */
const OVERDUE_LOOKBACK_HOURS = 6;

/**
 * Статуси, у яких дитина ще має щось зробити.
 *
 * Береться з наявної логіки, а не вигадується: `submitTask` дозволяє
 * подати завдання саме з ACTIVE і REJECTED. PENDING_REVIEW означає, що
 * дитина свою частину вже зробила й чекає на батьків — нагадувати їй про
 * дедлайн безглуздо. DONE, OVERDUE і LOST теж не потребують нагадувань.
 */
const PENDING_STATUSES = ["ACTIVE", "REJECTED"] as const;

export type JobSummary = {
  /** Скільки завдань потрапило під розгляд. */
  checked: number;
  dueSoon: number;
  overdue: number;
  /** Скільки відхилено унікальним індексом — тобто вже надсилали. */
  duplicates: number;
  errors: number;
  ms: number;
};

type Candidate = {
  id: string;
  title: string;
  dueAt: Date;
  childId: string;
  child: { timeZone: string };
};

const CANDIDATE_FIELDS = {
  id: true,
  title: true,
  dueAt: true,
  childId: true,
  child: { select: { timeZone: true } },
} as const;

export async function runReminders(now: Date = new Date()): Promise<JobSummary> {
  const startedAt = Date.now();
  const summary: JobSummary = {
    checked: 0,
    dueSoon: 0,
    overdue: 0,
    duplicates: 0,
    errors: 0,
    ms: 0,
  };

  const soonBefore = new Date(now.getTime() + DUE_SOON_MINUTES * 60_000);
  const horizon = new Date(now.getTime() - OVERDUE_LOOKBACK_HOURS * 3_600_000);

  // Вікно «скоро дедлайн» — уся година, а не п'ятихвилинний зріз навколо
  // 60-ї хвилини. Пропущений запуск job'а тоді нічого не губить: наступний
  // усе одно побачить завдання, а від дубля захищає dedupeKey.
  //
  // Кандидати на прострочення збираються ДО синхронізації статусів і
  // включають як ще не оновлені (ACTIVE/REJECTED з минулим дедлайном),
  // так і вже позначені OVERDUE. Інакше завдання, яке встиг перевести
  // лейаут під час чийогось візиту, лишилось би без сповіщення назавжди.
  const [dueSoon, expired] = await Promise.all([
    prisma.task.findMany({
      where: {
        status: { in: [...PENDING_STATUSES] },
        dueAt: { gt: now, lte: soonBefore },
      },
      select: CANDIDATE_FIELDS,
    }),
    prisma.task.findMany({
      where: {
        status: { in: [...PENDING_STATUSES, "OVERDUE"] },
        dueAt: { lt: now, gte: horizon },
      },
      select: CANDIDATE_FIELDS,
    }),
  ]);

  summary.checked = dueSoon.length + expired.length;

  await syncFamilies(now, summary);

  for (const task of dueSoon) {
    await send(summary, task, {
      type: "TASK_DUE_SOON",
      title: "Скоро дедлайн",
      body:
        `До завершення «${task.title}» лишилось ${formatTimeLeft(task.dueAt, now)}` +
        ` — дедлайн ${formatSubmittedLabel(task.dueAt, now, task.child.timeZone)}.`,
      href: `/child/tasks?filter=open&task=${task.id}`,
      dedupeKey: `due-soon-${DUE_SOON_MINUTES}:${task.id}`,
    });
  }

  for (const task of expired) {
    await send(summary, task, {
      type: "TASK_OVERDUE",
      title: "Завдання прострочено",
      body: `Час на виконання «${task.title}» закінчився.`,
      href: `/child/tasks?filter=missed&task=${task.id}`,
      dedupeKey: `overdue:${task.id}`,
    });
  }

  summary.ms = Date.now() - startedAt;

  // Без імен, назв завдань і будь-яких персональних даних — лише числа.
  console.log(
    `[jobs/reminders] перевірено ${summary.checked}` +
      ` · нагадувань ${summary.dueSoon}` +
      ` · прострочень ${summary.overdue}` +
      ` · дублів ${summary.duplicates}` +
      ` · помилок ${summary.errors}` +
      ` · ${summary.ms} мс`,
  );

  return summary;
}

/**
 * Оновлює статуси через наявну логіку, а не через власну копію правил.
 *
 * Синхронізуються всі родини, у яких є завдання з минулим дедлайном у
 * «робочому» статусі — і ті, що мають стати простроченими, і ті, що мають
 * стати втраченими. Так стан бази лишається правильним, навіть якщо в
 * застосунок ніхто не заходив.
 */
async function syncFamilies(now: Date, summary: JobSummary): Promise<void> {
  const families = await prisma.task.findMany({
    where: {
      status: { in: [...PENDING_STATUSES, "OVERDUE"] },
      dueAt: { lt: now },
    },
    select: { familyId: true },
    distinct: ["familyId"],
  });

  for (const { familyId } of families) {
    try {
      await syncTaskStatuses(familyId);
    } catch (error) {
      summary.errors += 1;
      console.error("[jobs/reminders] не вдалося оновити статуси родини:", error);
    }
  }
}

/**
 * Одне сповіщення. Помилка на конкретному завданні не зупиняє решту —
 * інакше одне зіпсоване завдання позбавило б нагадувань усіх дітей.
 */
async function send(
  summary: JobSummary,
  task: Candidate,
  message: { type: string; title: string; body: string; href: string; dedupeKey: string },
): Promise<void> {
  try {
    const result = await notify({
      userId: task.childId,
      type: message.type,
      title: message.title,
      body: message.body,
      href: message.href,
      taskId: task.id,
      dedupeKey: message.dedupeKey,
    });

    if (result === "created") {
      if (message.type === "TASK_DUE_SOON") summary.dueSoon += 1;
      else summary.overdue += 1;
    } else if (result === "duplicate") {
      summary.duplicates += 1;
    } else {
      summary.errors += 1;
    }
  } catch (error) {
    summary.errors += 1;
    console.error("[jobs/reminders] не вдалося створити сповіщення:", error);
  }
}
