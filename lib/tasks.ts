import "server-only";

import { prisma } from "./prisma";
import { levelInfo } from "./levels";

export const DEFAULT_GRACE_MINUTES = 60;

/**
 * Приводить статуси завдань у відповідність до поточного часу.
 * Викликається перед читанням списків — окремого планувальника немає.
 *
 * Два переходи:
 *   1. минув дедлайн            → «Прострочене», вмикається таймер;
 *   2. минув дедлайн + фора     → «Втрачене», зникає з екрана дитини.
 *
 * Обидва рахуються від dueAt, а не від моменту, коли застосунок це помітив.
 * Інакше після трьох днів без застосунку прострочене завдання отримало б
 * свіжу годину форою, хоча можливість давно втрачена.
 *
 * Завдання, подані на перевірку, не стають простроченими: дитина встигла,
 * і затримка батьків не має її карати.
 */
export async function syncTaskStatuses(familyId: string): Promise<void> {
  const now = new Date();

  const family = await prisma.family.findUnique({
    where: { id: familyId },
    select: { overdueGraceMinutes: true },
  });

  const graceMinutes = family?.overdueGraceMinutes ?? DEFAULT_GRACE_MINUTES;
  const lostBefore = new Date(now.getTime() - graceMinutes * 60_000);

  await prisma.task.updateMany({
    where: {
      familyId,
      status: { in: ["ACTIVE", "REJECTED"] },
      dueAt: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  await prisma.task.updateMany({
    where: {
      familyId,
      status: "OVERDUE",
      dueAt: { lt: lostBefore },
    },
    data: { status: "LOST" },
  });
}

/** Коли прострочене завдання зникне остаточно. */
export function lostAt(dueAt: Date, graceMinutes: number): Date {
  return new Date(dueAt.getTime() + graceMinutes * 60_000);
}

export type ApproveResult = {
  childId: string;
  xpAwarded: number;
  coinsAwarded: number;
  levelBefore: number;
  levelAfter: number;
};

/**
 * Зараховує завдання: ставить «Виконане», пише записи в журнал
 * і оновлює лічильники дитини. Єдине місце в системі, де нараховуються
 * XP і коіни — сюди ведуть і батьківське підтвердження, і автозарахування.
 */
async function creditTask(taskId: string, familyId: string): Promise<ApproveResult> {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({ where: { id: taskId, familyId } });
    if (!task) throw new Error("Завдання не знайдено.");
    // Захист від подвійного нарахування, якщо два підтвердження прийдуть разом.
    if (task.status === "DONE") throw new Error("Завдання вже зараховане.");

    const child = await tx.user.findUniqueOrThrow({ where: { id: task.childId } });
    const levelBefore = levelInfo(child.xp).level;

    await tx.task.update({
      where: { id: task.id },
      data: { status: "DONE", reviewedAt: new Date() },
    });

    if (task.xpReward > 0) {
      await tx.ledgerEntry.create({
        data: {
          familyId,
          childId: task.childId,
          kind: "XP",
          amount: task.xpReward,
          reason: "TASK_APPROVED",
          taskId: task.id,
        },
      });
    }

    if (task.coinReward > 0) {
      await tx.ledgerEntry.create({
        data: {
          familyId,
          childId: task.childId,
          kind: "COIN",
          amount: task.coinReward,
          reason: "TASK_APPROVED",
          taskId: task.id,
        },
      });
    }

    const updated = await tx.user.update({
      where: { id: task.childId },
      data: {
        xp: { increment: task.xpReward },
        coinsBalance: { increment: task.coinReward },
        coinsEarnedTotal: { increment: task.coinReward },
      },
    });

    return {
      childId: task.childId,
      xpAwarded: task.xpReward,
      coinsAwarded: task.coinReward,
      levelBefore,
      levelAfter: levelInfo(updated.xp).level,
    };
  });
}

export type SubmitResult = {
  /** true — завдання зараховане одразу, без черги на перевірку. */
  autoApproved: boolean;
  credited: ApproveResult | null;
};

/**
 * Дитина позначає завдання виконаним.
 * Зазвичай воно лише стає в чергу на перевірку. Виняток — дрібні звички,
 * яким батьки увімкнули «зараховувати без перевірки»: вони зараховуються одразу.
 */
export async function submitTask(
  taskId: string,
  childId: string,
  comment: string | null,
): Promise<SubmitResult> {
  const task = await prisma.task.findFirst({ where: { id: taskId, childId } });
  if (!task) throw new Error("Завдання не знайдено.");

  if (task.dueAt.getTime() < Date.now()) {
    throw new Error("Термін виконання минув.");
  }
  if (task.status !== "ACTIVE" && task.status !== "REJECTED") {
    throw new Error("Це завдання зараз не можна позначити виконаним.");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "PENDING_REVIEW",
      submittedAt: new Date(),
      childComment: comment?.trim() || null,
    },
  });

  if (!task.autoApprove) {
    return { autoApproved: false, credited: null };
  }

  const credited = await creditTask(task.id, task.familyId);
  return { autoApproved: true, credited };
}

/**
 * Батьки підтверджують виконання. Підтвердження остаточне.
 */
export async function approveTask(taskId: string, familyId: string): Promise<ApproveResult> {
  const task = await prisma.task.findFirst({ where: { id: taskId, familyId } });
  if (!task) throw new Error("Завдання не знайдено.");
  if (task.status !== "PENDING_REVIEW") {
    throw new Error("Завдання не очікує перевірки.");
  }

  return creditTask(taskId, familyId);
}

/** Батьки відхиляють виконання з коментарем. Завдання можна виконати повторно. */
export async function rejectTask(taskId: string, familyId: string, comment: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, familyId } });
  if (!task) throw new Error("Завдання не знайдено.");
  if (task.status !== "PENDING_REVIEW") {
    throw new Error("Завдання не очікує перевірки.");
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      parentComment: comment.trim(),
    },
  });
}
