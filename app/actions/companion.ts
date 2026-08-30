"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireChild } from "@/lib/auth";
import { SPECIES, ROOM_SLOTS } from "@/lib/companion/catalog";
import { CARE_ACTIONS } from "@/lib/companion/state";
import { adoptCompanion, careFor, placeItem, renameCompanion } from "@/lib/companion/service";
import { type ActionState, fail, ok } from "./types";

function revalidateCompanion() {
  revalidatePath("/child");
  revalidatePath("/child/companion");
  revalidatePath("/child/family");
  revalidatePath("/parent/family");
}

const adoptSchema = z.object({
  species: z.enum(SPECIES.map((s) => s.id) as [string, ...string[]]),
  name: z
    .string()
    .trim()
    .min(2, "Придумай ім'я — хоча б дві букви.")
    .max(20, "Задовге ім'я, спробуй коротше."),
});

export async function adoptCompanionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireChild();

  const parsed = adoptSchema.safeParse({
    species: formData.get("species"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  try {
    await adoptCompanion(child.id, parsed.data.species, parsed.data.name);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не вдалося.");
  }

  revalidateCompanion();
  return ok(`${parsed.data.name} тепер із тобою!`);
}

const renameSchema = z.object({
  name: z.string().trim().min(2, "Ім'я закоротке.").max(20, "Ім'я задовге."),
});

export async function renameCompanionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireChild();

  const parsed = renameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір ім'я.");
  }

  try {
    await renameCompanion(child.id, parsed.data.name);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не вдалося.");
  }

  revalidateCompanion();
  return ok("Ім'я змінено.");
}

const careSchema = z.object({
  action: z.enum(CARE_ACTIONS.map((a) => a.id) as [string, ...string[]]),
});

export async function careAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireChild();

  const parsed = careSchema.safeParse({ action: formData.get("action") });
  if (!parsed.success) return fail("Невідома дія.");

  const chosen = CARE_ACTIONS.find((a) => a.id === parsed.data.action)!;

  try {
    await careFor(child.id, chosen.id);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не вдалося.");
  }

  revalidateCompanion();
  return ok(chosen.done);
}

const placeSchema = z.object({
  slot: z.enum(ROOM_SLOTS.map((s) => s.id) as [string, ...string[]]),
  itemId: z.string().min(1),
});

export async function placeItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireChild();

  const parsed = placeSchema.safeParse({
    slot: formData.get("slot"),
    itemId: formData.get("itemId"),
  });
  if (!parsed.success) return fail("Невідомий предмет.");

  try {
    await placeItem(child.id, parsed.data.slot, parsed.data.itemId);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не вдалося поставити.");
  }

  revalidateCompanion();
  return ok("Готово!");
}
