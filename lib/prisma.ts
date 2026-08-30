import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/app/generated/prisma/client";

// Prisma 7 працює з базою через драйвер-адаптер.
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Не задано DATABASE_URL — перевір файл .env.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// У dev-режимі Next.js перезавантажує модулі при кожній зміні файлу,
// тому клієнт тримаємо в globalThis, щоб не плодити з'єднання з базою.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
