import { notFound } from "next/navigation";

import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionCard } from "@/components/ui";
import { RewardForm } from "@/components/parent/RewardForm";

export default async function EditRewardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const parent = await requireParent();
  const { id } = await params;

  const reward = await prisma.reward.findFirst({
    where: { id, familyId: parent.familyId },
  });
  if (!reward) notFound();

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
          Редагувати нагороду
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Зміни діють для нових обмінів — уже подані заявки зберігають стару назву й ціну.
        </p>
      </header>

      <SectionCard title="Деталі">
        <RewardForm
          mode="edit"
          values={{
            rewardId: reward.id,
            title: reward.title,
            description: reward.description ?? "",
            emoji: reward.emoji,
            costCoins: reward.costCoins,
          }}
        />
      </SectionCard>
    </div>
  );
}
