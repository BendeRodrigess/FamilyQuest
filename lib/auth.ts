import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "./prisma";
import type { Role } from "./domain";

const SESSION_COOKIE = "fq_session";
const SESSION_TTL_DAYS = 30;
const SCRYPT_KEYLEN = 64;

/* ---------- Паролі ---------- */

// scrypt із вбудованого node:crypto — без зовнішніх залежностей і без нативних збірок.
// Формат зберігання: "<сіль>:<хеш>", обидві частини у hex.
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  if (expected.length !== SCRYPT_KEYLEN) return false;

  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  return timingSafeEqual(candidate, expected);
}

/* ---------- Сесії ---------- */

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { family: true } } },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/* ---------- Охорона маршрутів ---------- */

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== role) {
    // Дитина не має доступу до батьківських екранів і навпаки —
    // просто відправляємо кожного на його головну.
    redirect(user.role === "PARENT" ? "/parent" : "/child");
  }
  return user;
}

export const requireParent = () => requireRole("PARENT");
export const requireChild = () => requireRole("CHILD");
