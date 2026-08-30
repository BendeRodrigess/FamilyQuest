"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/auth";
import { COIN_MAX, COIN_MIN, XP_MAX, XP_MIN, serializeWeekdays } from "@/lib/domain";
import { type ActionState, fail, ok } from "./types";

function revalidateAll() {
  revalidatePath("/parent");
  revalidatePath("/parent/tasks");
  revalidatePath("/child");
  revalidatePath("/child/tasks");
}

const templateSchema = z.object({
  childId: z.string().min(1, "Обери дитину."),
  title: z.string().trim().min(2, "Назва завдання надто коротка.").max(120, "Назва задовга."),
  description: z.string().trim().max(1000, "Опис задовгий.").optional(),
  dueTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Вкажи час у форматі 20:00."),
  weekdays: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1, "Обери хоча б один день тижня."),
  xpReward: z.coerce
    .number()
    .int("XP має бути цілим числом.")
    .min(XP_MIN, `Мінімум ${XP_MIN} XP.`)
    .max(XP_MAX, `Максимум ${XP_MAX} XP.`),
  coinReward: z.coerce
    .number()
    .int("Коіни мають бути цілим числом.")
    .min(COIN_MIN)
    .max(COIN_MAX, `Максимум ${COIN_MAX} коінів.`),
  autoApprove: z.boolean(),
});

function readFields(formData: FormData) {
  return templateSchema.safeParse({
    childId: formData.get("childId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    dueTime: formData.get("dueTime"),
    weekdays: formData.getAll("weekdays"),
    xpReward: formData.get("xpReward"),
    coinReward: formData.get("coinReward") || 0,
    autoApprove: formData.get("autoApprove") === "on",
  });
}

export async function createTemplateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const parsed = readFields(formData);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  const data = parsed.data;

  const child = await prisma.user.findFirst({
    where: { id: data.childId, familyId: parent.familyId, role: "CHILD" },
  });
  if (!child) return fail("Дитину не знайдено.");

  await prisma.taskTemplate.create({
    data: {
      familyId: parent.familyId,
      childId: child.id,
      title: data.title,
      description: data.description || null,
      dueTime: data.dueTime,
      weekdays: serializeWeekdays(data.weekdays),
      xpReward: data.xpReward,
      coinReward: data.coinReward,
      autoApprove: data.autoApprove,
    },
  });

  revalidateAll();
  redirect("/parent/tasks?filter=repeating");
}

export async function updateTemplateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const templateId = String(formData.get("templateId") ?? "");
  const parsed = readFields(formData);

  if (!templateId) return fail("Шаблон не знайдено.");
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  const data = parsed.data;

  const updated = await prisma.taskTemplate.updateMany({
    where: { id: templateId, familyId: parent.familyId },
    data: {
      childId: data.childId,
      title: data.title,
      description: data.description || null,
      dueTime: data.dueTime,
      weekdays: serializeWeekdays(data.weekdays),
      xpReward: data.xpReward,
      coinReward: data.coinReward,
      autoApprove: data.autoApprove,
    },
  });

  if (updated.count === 0) return fail("Шаблон не знайдено.");

  revalidateAll();
  redirect("/parent/tasks?filter=repeating");
}

export async function toggleTemplatePauseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const templateId = String(formData.get("templateId") ?? "");

  const template = await prisma.taskTemplate.findFirst({
    where: { id: templateId, familyId: parent.familyId },
  });
  if (!template) return fail("Шаблон не знайдено.");

  await prisma.taskTemplate.update({
    where: { id: template.id },
    data: { isPaused: !template.isPaused },
  });

  revalidateAll();
  return ok(template.isPaused ? "Повторення відновлено." : "Повторення призупинено.");
}

export async function deleteTemplateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const templateId = String(formData.get("templateId") ?? "");

  // Уже видані екземпляри лишаються: історія виконаних завдань
  // не повинна зникати разом із шаблоном.
  const deleted = await prisma.taskTemplate.deleteMany({
    where: { id: templateId, familyId: parent.familyId },
  });
  if (deleted.count === 0) return fail("Шаблон не знайдено.");

  revalidateAll();
  return ok("Повторюване завдання видалено.");
}
