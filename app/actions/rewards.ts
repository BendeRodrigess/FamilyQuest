"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireParent } from "@/lib/auth";
import { payoutCoins } from "@/lib/rewards";
import { type ActionState, fail, ok } from "./types";

const payoutSchema = z.object({
  childId: z.string().min(1, "Обери дитину."),
  amount: z.coerce
    .number()
    .int("Сума має бути цілим числом.")
    .positive("Сума має бути більшою за нуль."),
  note: z.string().trim().max(200, "Примітка задовга.").optional(),
});

export async function payoutAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const parsed = payoutSchema.safeParse({
    childId: formData.get("childId"),
    amount: formData.get("amount"),
    note: formData.get("note") ?? "",
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Перевір заповнені поля.");
  }

  try {
    await payoutCoins(
      parsed.data.childId,
      parent.familyId,
      parsed.data.amount,
      parsed.data.note ?? null,
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не вдалося записати виплату.");
  }

  revalidatePath("/parent/rewards");
  revalidatePath("/parent");
  revalidatePath("/child");
  revalidatePath("/child/rewards");
  return ok(`Записано виплату: ${parsed.data.amount} коінів.`);
}
