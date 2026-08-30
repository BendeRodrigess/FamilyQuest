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
