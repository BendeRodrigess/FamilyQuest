"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireChild, requireParent } from "@/lib/auth";
import { declineRedemption, fulfillRedemption, redeemReward } from "@/lib/shop";
import { REWARD_COST_MAX, REWARD_COST_MIN, REWARD_EMOJI } from "@/lib/domain";
import { type ActionState, fail, ok } from "./types";

function revalidateShop() {
  revalidatePath("/parent");
  revalidatePath("/parent/rewards");
  revalidatePath("/child");
  revalidatePath("/child/rewards");
}

/* ---------- Керування вітриною (батьки) ---------- */

const rewardSchema = z.object({
  title: z.string().trim().min(2, "Назва нагороди надто коротка.").max(80, "Назва задовга."),
  description: z.string().trim().max(300, "Опис задовгий.").optional(),
  emoji: z
    .string()
    .refine((v) => (REWARD_EMOJI as readonly string[]).includes(v), "Обери значок зі списку."),
  costCoins: z.coerce
    .number()
    .int("Ціна має бути цілим числом.")
    .min(REWARD_COST_MIN, `Мінімум ${REWARD_COST_MIN} коін.`)
    .max(REWARD_COST_MAX, "Ціна завелика."),
});

function readReward(formData: FormData) {
  return rewardSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    emoji: formData.get("emoji"),
    costCoins: formData.get("costCoins"),
  });
}

export async function createRewardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const parsed = readReward(formData);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  await prisma.reward.create({
    data: {
      familyId: parent.familyId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      emoji: parsed.data.emoji,
      costCoins: parsed.data.costCoins,
    },
  });

  revalidateShop();
  redirect("/parent/rewards?tab=shop");
}

export async function updateRewardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const rewardId = String(formData.get("rewardId") ?? "");
  const parsed = readReward(formData);

  if (!rewardId) return fail("Нагороду не знайдено.");
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  const updated = await prisma.reward.updateMany({
    where: { id: rewardId, familyId: parent.familyId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      emoji: parsed.data.emoji,
      costCoins: parsed.data.costCoins,
    },
  });

  if (updated.count === 0) return fail("Нагороду не знайдено.");

  revalidateShop();
  redirect("/parent/rewards?tab=shop");
}

export async function toggleRewardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const rewardId = String(formData.get("rewardId") ?? "");

  const reward = await prisma.reward.findFirst({
    where: { id: rewardId, familyId: parent.familyId },
  });
  if (!reward) return fail("Нагороду не знайдено.");

  await prisma.reward.update({
    where: { id: reward.id },
    data: { isActive: !reward.isActive },
  });

  revalidateShop();
  return ok(reward.isActive ? "Прибрано з вітрини." : "Повернуто на вітрину.");
}

export async function deleteRewardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const rewardId = String(formData.get("rewardId") ?? "");

  // Заявки лишаються: історія обмінів зберігає назву й ціну на момент обміну.
  const deleted = await prisma.reward.deleteMany({
    where: { id: rewardId, familyId: parent.familyId },
  });
  if (deleted.count === 0) return fail("Нагороду не знайдено.");

  revalidateShop();
  return ok("Нагороду видалено.");
}

/* ---------- Обмін (дитина) ---------- */

export async function redeemRewardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireChild();
  const rewardId = String(formData.get("rewardId") ?? "");
  const note = String(formData.get("note") ?? "");

  try {
    await redeemReward(rewardId, child.id, note);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не вдалося обміняти.");
  }

  revalidateShop();
  return ok("Заявку надіслано батькам.");
}

/* ---------- Видача (батьки) ---------- */

export async function fulfillRedemptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const redemptionId = String(formData.get("redemptionId") ?? "");

  try {
    await fulfillRedemption(redemptionId, parent.familyId);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не вдалося позначити видачу.");
  }

  revalidateShop();
  return ok("Позначено як видане.");
}

const declineSchema = z.object({
  redemptionId: z.string().min(1),
  comment: z
    .string()
    .trim()
    .min(3, "Поясни коротко, чому не виходить.")
    .max(300, "Коментар задовгий."),
});

export async function declineRedemptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const parsed = declineSchema.safeParse({
    redemptionId: formData.get("redemptionId"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір коментар.");
  }

  try {
    await declineRedemption(parsed.data.redemptionId, parent.familyId, parsed.data.comment);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не вдалося відхилити.");
  }

  revalidateShop();
  return ok("Відхилено, коіни повернуто дитині.");
}
