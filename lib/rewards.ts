import "server-only";

import { prisma } from "./prisma";

/**
 * Батьки позначають, що частину накопичених коінів видано дитині.
 * Баланс зменшується, а «зароблено всього» лишається незмінним —
 * це теж форма прогресу і воно ніколи не падає.
 */
export async function payoutCoins(
  childId: string,
  familyId: string,
  amount: number,
  note: string | null,
) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Сума виплати має бути додатним цілим числом.");
  }

  return prisma.$transaction(async (tx) => {
    const child = await tx.user.findFirst({
      where: { id: childId, familyId, role: "CHILD" },
    });
    if (!child) throw new Error("Дитину не знайдено.");
    if (amount > child.coinsBalance) {
      throw new Error("Сума виплати більша за накопичений баланс.");
    }

    await tx.ledgerEntry.create({
      data: {
        familyId,
        childId,
        kind: "COIN",
        amount: -amount,
        reason: "PAYOUT",
        note: note?.trim() || null,
      },
    });

    return tx.user.update({
      where: { id: childId },
      data: { coinsBalance: { decrement: amount } },
    });
  });
}
