import "server-only";

import { prisma } from "./prisma";

/**
 * Дитина обмінює коіни на нагороду.
 *
 * Коіни списуються одразу, а не після видачі. Інакше можна було б замовити
 * п'ять нагород на баланс, якого вистачає на одну: батьки побачили б п'ять
 * заявок і борг, якого дитина не заробляла. При відмові коіни повертаються
 * повністю — списання тут не покарання, а резервування.
 *
 * «Зароблено всього» не змінюється: витрати не применшують того, що зароблено.
 */
export async function redeemReward(rewardId: string, childId: string, note: string | null) {
  return prisma.$transaction(async (tx) => {
    const child = await tx.user.findFirst({ where: { id: childId, role: "CHILD" } });
    if (!child) throw new Error("Дитину не знайдено.");

    const reward = await tx.reward.findFirst({
      where: { id: rewardId, familyId: child.familyId },
    });
    if (!reward) throw new Error("Нагороду не знайдено.");
    if (!reward.isActive) throw new Error("Ця нагорода зараз недоступна.");

    if (child.coinsBalance < reward.costCoins) {
      throw new Error(
        `Не вистачає коінів: потрібно ${reward.costCoins}, а є ${child.coinsBalance}.`,
      );
    }

    const redemption = await tx.rewardRedemption.create({
      data: {
        familyId: child.familyId,
        childId: child.id,
        rewardId: reward.id,
        titleSnapshot: reward.title,
        costSnapshot: reward.costCoins,
        emojiSnapshot: reward.emoji,
        childNote: note?.trim() || null,
        status: "PENDING",
      },
    });

    await tx.ledgerEntry.create({
      data: {
        familyId: child.familyId,
        childId: child.id,
        kind: "COIN",
        amount: -reward.costCoins,
        reason: "REWARD_REDEEMED",
        note: reward.title,
      },
    });

    await tx.user.update({
      where: { id: child.id },
      data: { coinsBalance: { decrement: reward.costCoins } },
    });

    return redemption;
  });
}

/** Батьки підтверджують, що нагороду видано. Коіни вже списані при заявці. */
export async function fulfillRedemption(redemptionId: string, familyId: string) {
  const redemption = await prisma.rewardRedemption.findFirst({
    where: { id: redemptionId, familyId },
  });
  if (!redemption) throw new Error("Заявку не знайдено.");
  if (redemption.status !== "PENDING") throw new Error("Заявку вже опрацьовано.");

  return prisma.rewardRedemption.update({
    where: { id: redemption.id },
    data: { status: "FULFILLED", decidedAt: new Date() },
  });
}

/** Батьки відмовляють. Коіни повертаються дитині повністю. */
export async function declineRedemption(
  redemptionId: string,
  familyId: string,
  comment: string,
) {
  return prisma.$transaction(async (tx) => {
    const redemption = await tx.rewardRedemption.findFirst({
      where: { id: redemptionId, familyId },
    });
    if (!redemption) throw new Error("Заявку не знайдено.");
    if (redemption.status !== "PENDING") throw new Error("Заявку вже опрацьовано.");

    await tx.ledgerEntry.create({
      data: {
        familyId,
        childId: redemption.childId,
        kind: "COIN",
        amount: redemption.costSnapshot,
        reason: "REWARD_REFUNDED",
        note: redemption.titleSnapshot,
      },
    });

    await tx.user.update({
      where: { id: redemption.childId },
      data: { coinsBalance: { increment: redemption.costSnapshot } },
    });

    return tx.rewardRedemption.update({
      where: { id: redemption.id },
      data: {
        status: "DECLINED",
        decidedAt: new Date(),
        parentComment: comment.trim(),
      },
    });
  });
}
