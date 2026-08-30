"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { type ActionState, fail, ok } from "./types";

const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Введи ім'я — щонайменше 2 символи."),
  email: z.string().trim().toLowerCase().email("Це не схоже на email."),
  password: z.string().min(6, "Пароль має бути щонайменше 6 символів."),
});

export async function registerParentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  const { displayName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return fail("Акаунт з таким email вже існує.");
  }

  const parent = await prisma.user.create({
    data: {
      role: "PARENT",
      displayName,
      email,
      passwordHash: hashPassword(password),
      family: { create: { name: `Сім'я ${displayName}` } },
    },
  });

  await createSession(parent.id);
  redirect("/parent");
}

const loginSchema = z.object({
  mode: z.enum(["parent", "child"]),
  identifier: z.string().trim().min(1, "Введи email або логін."),
  password: z.string().min(1, "Введи пароль."),
});

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    mode: formData.get("mode"),
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  const { mode, identifier, password } = parsed.data;

  const user =
    mode === "parent"
      ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
      : await prisma.user.findUnique({ where: { username: identifier.toLowerCase() } });

  // Однакове повідомлення для «немає такого користувача» і «невірний пароль» —
  // щоб не можна було перебором дізнатися, які логіни існують.
  const invalid = fail("Невірний логін або пароль.");

  if (!user) return invalid;
  if (!verifyPassword(password, user.passwordHash)) return invalid;

  await createSession(user.id);
  redirect(user.role === "PARENT" ? "/parent" : "/child");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введи поточний пароль."),
    newPassword: z.string().min(4, "Новий пароль — щонайменше 4 символи."),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Новий пароль має відрізнятися від поточного.",
  });

/** Дитина може змінити власний пароль. Якщо забула — батьки задають новий. */
export async function changeOwnPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    return fail("Поточний пароль невірний.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.newPassword) },
  });

  return ok("Пароль змінено.");
}
