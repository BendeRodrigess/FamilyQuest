"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireChild, requireParent } from "@/lib/auth";
import { approveTask, rejectTask, submitTask } from "@/lib/tasks";
import { COIN_MAX, COIN_MIN, XP_MAX, XP_MIN } from "@/lib/domain";
import { type ActionState, fail, ok } from "./types";

function revalidateParent() {
  revalidatePath("/parent");
  revalidatePath("/parent/tasks");
}

function revalidateChild() {
  revalidatePath("/child");
  revalidatePath("/child/tasks");
}

const dueAtRule = z
  .string()
  .min(1, "Вкажи термін виконання.")
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Некоректна дата або час.")
  .transform((v) => new Date(v));

const taskFieldsSchema = z.object({
  childId: z.string().min(1, "Обери дитину."),
  title: z.string().trim().min(2, "Назва завдання надто коротка.").max(120, "Назва задовга."),
  description: z.string().trim().max(1000, "Опис задовгий.").optional(),
  dueAt: dueAtRule,
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
});

function readTaskFields(formData: FormData) {
  return taskFieldsSchema.safeParse({
    childId: formData.get("childId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    dueAt: formData.get("dueAt"),
    xpReward: formData.get("xpReward"),
    coinReward: formData.get("coinReward") || 0,
  });
}

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const parsed = readTaskFields(formData);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  const data = parsed.data;

  if (data.dueAt.getTime() < Date.now()) {
    return fail("Термін виконання вже минув — обери майбутню дату.");
  }

  const child = await prisma.user.findFirst({
    where: { id: data.childId, familyId: parent.familyId, role: "CHILD" },
  });
  if (!child) return fail("Дитину не знайдено.");

  await prisma.task.create({
    data: {
      familyId: parent.familyId,
      childId: child.id,
      title: data.title,
      description: data.description || null,
      dueAt: data.dueAt,
      xpReward: data.xpReward,
      coinReward: data.coinReward,
      status: "ACTIVE",
    },
  });

  revalidateParent();
  revalidateChild();
  redirect("/parent/tasks?filter=active");
}

export async function updateTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const taskId = String(formData.get("taskId") ?? "");
  const parsed = readTaskFields(formData);

  if (!taskId) return fail("Завдання не знайдено.");
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, familyId: parent.familyId },
  });
  if (!task) return fail("Завдання не знайдено.");
  if (task.status === "DONE") {
    return fail("Підтверджене завдання редагувати не можна.");
  }

  const data = parsed.data;

  // Перенесення дедлайну в майбутнє знімає прострочення.
  const status =
    task.status === "OVERDUE" && data.dueAt.getTime() > Date.now() ? "ACTIVE" : task.status;

  await prisma.task.update({
    where: { id: task.id },
    data: {
      childId: data.childId,
      title: data.title,
      description: data.description || null,
      dueAt: data.dueAt,
      xpReward: data.xpReward,
      coinReward: data.coinReward,
      status,
    },
  });

  revalidateParent();
  revalidateChild();
  redirect("/parent/tasks?filter=active");
}

export async function deleteTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const taskId = String(formData.get("taskId") ?? "");

  const deleted = await prisma.task.deleteMany({
    where: { id: taskId, familyId: parent.familyId },
  });
  if (deleted.count === 0) return fail("Завдання не знайдено.");

  revalidateParent();
  revalidateChild();
  return ok("Завдання видалено.");
}

/* ---------- Дії дитини ---------- */

export async function submitTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireChild();
  const taskId = String(formData.get("taskId") ?? "");
  const comment = String(formData.get("comment") ?? "");

  try {
    await submitTask(taskId, child.id, comment);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не вдалося надіслати на перевірку.");
  }

  revalidateChild();
  revalidateParent();
  return ok("Надіслано батькам на перевірку.");
}

/* ---------- Перевірка батьками ---------- */

export async function approveTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const taskId = String(formData.get("taskId") ?? "");

  try {
    const result = await approveTask(taskId, parent.familyId);
    revalidateParent();
    revalidateChild();

    const levelUp =
      result.levelAfter > result.levelBefore ? ` Новий рівень — ${result.levelAfter}!` : "";
    const coins = result.coinsAwarded > 0 ? ` і ${result.coinsAwarded} коінів` : "";

    return ok(`Підтверджено: +${result.xpAwarded} XP${coins}.${levelUp}`);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не вдалося підтвердити.");
  }
}

const rejectSchema = z.object({
  taskId: z.string().min(1),
  comment: z
    .string()
    .trim()
    .min(3, "Напиши коротко, що саме потрібно переробити.")
    .max(500, "Коментар задовгий."),
});

export async function rejectTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const parsed = rejectSchema.safeParse({
    taskId: formData.get("taskId"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір коментар.");
  }

  try {
    await rejectTask(parsed.data.taskId, parent.familyId, parsed.data.comment);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не вдалося відхилити.");
  }

  revalidateParent();
  revalidateChild();
  return ok("Відхилено. Дитина побачить коментар і зможе виконати ще раз.");
}
