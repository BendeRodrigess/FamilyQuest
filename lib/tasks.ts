import "server-only";

import { prisma } from "./prisma";
import { levelInfo } from "./levels";

/**
 * Переводить прострочені завдання у відповідний статус.
 * Викликається перед читанням списків — у Хвилі 1 цього достатньо,
 * фонового планувальника не потрібно.
 *
 * Завдання, подані на перевірку, не стають простроченими: дитина встигла,
 * і затримка батьків не має її карати.
 */
export async function syncOverdueTasks(familyId: string): Promise<void> {
  await prisma.task.updateMany({
    where: {
      familyId,
      status: { in: ["ACTIVE", "REJECTED"] },
      dueAt: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });
}

/** Дитина подає завдання на перевірку. XP і коіни тут НЕ нараховуються. */
export async function submitTask(taskId: string, childId: string, comment: string | null) {
  const task = await prisma.task.findFirst({ where: { id: taskId, childId } });
  if (!task) throw new Error("Завдання не знайдено.");

  if (task.dueAt.getTime() < Date.now()) {
    throw new Error("Термін виконання минув.");
  }
  if (task.status !== "ACTIVE" && task.status !== "REJECTED") {
    throw new Error("Це завдання зараз не можна позначити виконаним.");
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: "PENDING_REVIEW",
      submittedAt: new Date(),
      childComment: comment?.trim() || null,
    },
  });
}

export type ApproveResult = {
  childId: string;
  xpAwarded: number;
  coinsAwarded: number;
  levelBefore: number;
  levelAfter: number;
};

/**
 * Батьки підтверджують виконання — єдина точка в системі,
 * де нараховуються XP і коіни. Підтвердження остаточне.
 */
export async function approveTask(taskId: string, familyId: string): Promise<ApproveResult> {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({ where: { id: taskId, familyId } });
    if (!task) throw new Error("Завдання не знайдено.");
    if (task.status !== "PENDING_REVIEW") {
      throw new Error("Завдання не очікує перевірки.");
    }

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
