import "server-only";

import { prisma } from "@/lib/prisma";
import { levelInfo } from "@/lib/levels";
import { DEFAULT_ROOM, itemById, type RoomSlot } from "./catalog";
import { CARE_COST, applyCare, decay, type CareAction } from "./state";

/**
 * Читає компаньйона й дорахо́вує спадання шкал за час, що минув.
 * Стан записується назад одразу — інакше кожне відкриття сторінки
 * рахувало б від старої позначки й спадання накопичувалось би двічі.
 */
export async function getCompanion(childId: string) {
  const companion = await prisma.companion.findUnique({ where: { childId } });
  if (!companion) return null;

  const now = new Date();
  const next = decay(
    { fullness: companion.fullness, mood: companion.mood, energy: companion.energy },
    companion.lastTickAt,
    now,
  );

  const unchanged =
    next.fullness === companion.fullness &&
    next.mood === companion.mood &&
    next.energy === companion.energy;

  if (unchanged) return companion;

  return prisma.companion.update({
    where: { id: companion.id },
    data: { ...next, lastTickAt: now },
  });
}

export async function adoptCompanion(childId: string, species: string, name: string) {
  const existing = await prisma.companion.findUnique({ where: { childId } });
  if (existing) throw new Error("Компаньйон уже є.");

  return prisma.companion.create({
    data: { childId, species, name: name.trim() },
  });
}

export async function renameCompanion(childId: string, name: string) {
  const companion = await prisma.companion.findUnique({ where: { childId } });
  if (!companion) throw new Error("Компаньйона ще немає.");

  return prisma.companion.update({
    where: { id: companion.id },
    data: { name: name.trim() },
  });
}

/**
 * Дія догляду. Коштує одну зірочку, яку дає підтверджене завдання —
 * саме тут замикається петля «зробив справу → подбав про улюбленця».
 */
export async function careFor(childId: string, action: CareAction) {
  return prisma.$transaction(async (tx) => {
    const child = await tx.user.findFirst({ where: { id: childId, role: "CHILD" } });
    if (!child) throw new Error("Дитину не знайдено.");
    if (child.careStars < CARE_COST) {
      throw new Error("Немає зірочок. Виконай квест — і зможеш подбати про улюбленця.");
    }

    const companion = await tx.companion.findUnique({ where: { childId } });
    if (!companion) throw new Error("Компаньйона ще немає.");

    const now = new Date();
    const current = decay(
      { fullness: companion.fullness, mood: companion.mood, energy: companion.energy },
      companion.lastTickAt,
      now,
    );

    await tx.user.update({
      where: { id: child.id },
      data: { careStars: { decrement: CARE_COST } },
    });

    return tx.companion.update({
      where: { id: companion.id },
      data: { ...applyCare(current, action), lastTickAt: now },
    });
  });
}

/* ---------- Кімната ---------- */

export type Room = Record<RoomSlot, string>;

export async function getRoom(childId: string): Promise<Room> {
  const placements = await prisma.roomPlacement.findMany({ where: { childId } });

  const room = { ...DEFAULT_ROOM };
  for (const placement of placements) {
    if (placement.slot in room) {
      room[placement.slot as RoomSlot] = placement.itemId;
    }
  }
  return room;
}

/** Предмет можна поставити лише якщо рівень дитини вже його відкрив. */
export async function placeItem(childId: string, slot: string, itemId: string) {
  const child = await prisma.user.findFirst({ where: { id: childId, role: "CHILD" } });
  if (!child) throw new Error("Дитину не знайдено.");

  const item = itemById(itemId);
  if (!item || item.slot !== slot) throw new Error("Такого предмета немає.");

  const level = levelInfo(child.xp).level;
  if (level < item.unlockLevel) {
    throw new Error(`Відкриється на ${item.unlockLevel} рівні.`);
  }

  return prisma.roomPlacement.upsert({
    where: { childId_slot: { childId, slot } },
    create: { childId, slot, itemId },
    update: { itemId },
  });
}
