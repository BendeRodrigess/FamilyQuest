import { requireParent } from "@/lib/auth";
import { SectionCard } from "@/components/ui";
import { RewardForm } from "@/components/parent/RewardForm";

export default async function NewRewardPage() {
  await requireParent();

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
          Нова нагорода
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Дитина зможе обміняти на неї зароблені коіни — а ви підтвердите видачу.
        </p>
      </header>

      <SectionCard title="Деталі">
        <RewardForm
          mode="create"
          values={{ title: "", description: "", emoji: "🎁", costCoins: 50 }}
        />
      </SectionCard>
    </div>
  );
}
