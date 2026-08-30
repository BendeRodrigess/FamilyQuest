"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireParent, hashPassword } from "@/lib/auth";
import { AVATAR_COLORS } from "@/lib/domain";
import { type ActionState, fail, ok } from "./types";

const usernameRule = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Логін має бути щонайменше 3 символи.")
  .max(20, "Логін задовгий — максимум 20 символів.")
  .regex(/^[a-z0-9._-]+$/, "У логіні можна використовувати лише латинські літери, цифри, крапку, дефіс і підкреслення.");

const addChildSchema = z.object({
  displayName: z.string().trim().min(2, "Введи ім'я дитини."),
  username: usernameRule,
  password: z.string().min(4, "Пароль дитини — щонайменше 4 символи."),
});

export async function addChildAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const parsed = addChildSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  const { displayName, username, password } = parsed.data;

  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) {
    return fail("Такий логін уже зайнятий — вибери інший.");
  }

  const childCount = await prisma.user.count({
    where: { familyId: parent.familyId, role: "CHILD" },
  });

  await prisma.user.create({
    data: {
      familyId: parent.familyId,
      role: "CHILD",
      displayName,
      username,
      passwordHash: hashPassword(password),
      avatarColor: AVATAR_COLORS[childCount % AVATAR_COLORS.length],
    },
  });

  revalidatePath("/parent/family");
  revalidatePath("/parent");
  return ok(`Готово! Логін для входу: ${username}`);
}

const resetPasswordSchema = z.object({
  childId: z.string().min(1),
  password: z.string().min(4, "Пароль — щонайменше 4 символи."),
});

/**
 * Батьки не бачать поточний пароль дитини — він зберігається лише у вигляді хешу.
 * Замість цього вони задають новий і одразу бачать його на екрані,
 * щоб передати дитині. Доступ повертається, паролі в базі лишаються захищеними.
 */
export async function resetChildPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const parsed = resetPasswordSchema.safeParse({
    childId: formData.get("childId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  const child = await prisma.user.findFirst({
    where: { id: parsed.data.childId, familyId: parent.familyId, role: "CHILD" },
  });
  if (!child) return fail("Дитину не знайдено.");

  await prisma.user.update({
    where: { id: child.id },
    data: { passwordHash: hashPassword(parsed.data.password) },
  });

  // Усі активні сесії дитини скидаємо — доступ по старому паролю має припинитись.
  await prisma.session.deleteMany({ where: { userId: child.id } });

  revalidatePath("/parent/family");
  return {
    error: null,
    success: `Пароль оновлено. Передай дитині логін ${child.username} і новий пароль.`,
    revealPassword: parsed.data.password,
  };
}

const renameChildSchema = z.object({
  childId: z.string().min(1),
  displayName: z.string().trim().min(2, "Введи ім'я дитини."),
});

export async function renameChildAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const parsed = renameChildSchema.safeParse({
    childId: formData.get("childId"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  const updated = await prisma.user.updateMany({
    where: { id: parsed.data.childId, familyId: parent.familyId, role: "CHILD" },
    data: { displayName: parsed.data.displayName },
  });

  if (updated.count === 0) return fail("Дитину не знайдено.");

  revalidatePath("/parent/family");
  revalidatePath("/parent");
  return ok("Ім'я оновлено.");
}
