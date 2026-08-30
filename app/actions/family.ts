"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/auth";
import { type ActionState, fail, ok } from "./types";

const renameSchema = z.object({
  name: z.string().trim().min(2, "Назва сім'ї надто коротка.").max(60, "Назва задовга."),
});

export async function renameFamilyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const parsed = renameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір назву.");
  }

  await prisma.family.update({
    where: { id: parent.familyId },
    data: { name: parsed.data.name },
  });

  revalidatePath("/parent/settings");
  return ok("Назву сім'ї оновлено.");
}

const preferencesSchema = z.object({
  showSiblingProgress: z.boolean(),
  overdueGraceMinutes: z.coerce
    .number()
    .int("Вкажи ціле число хвилин.")
    .min(5, "Мінімум 5 хвилин — інакше завдання зникатиме надто швидко.")
    .max(1440, "Максимум доба."),
});

/** Налаштування сім'ї: видимість прогресу між дітьми та тривалість таймера. */
export async function updateFamilyPreferencesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const parsed = preferencesSchema.safeParse({
    showSiblingProgress: formData.get("showSiblingProgress") === "on",
    overdueGraceMinutes: formData.get("overdueGraceMinutes"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  await prisma.family.update({
    where: { id: parent.familyId },
    data: parsed.data,
  });

  revalidatePath("/parent/settings");
  revalidatePath("/child");
  revalidatePath("/child/family");
  return ok("Налаштування збережено.");
}
