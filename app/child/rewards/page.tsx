import { requireChild } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/format";
import { IconCoin, IconZap } from "@/components/icons";
import { EmptyState, Pill, SectionCard, StatCard } from "@/components/ui";

export default async function ChildRewardsPage() {
  const child = await requireChild();
  const now = new Date();

  const history = await prisma.ledgerEntry.findMany({
    where: { childId: child.id },
    include: { task: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">Винагороди</h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Коіни можна отримати в батьків. XP залишається з тобою назавжди.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<IconCoin />}
          tone="mint"
          label="Доступно зараз"
          value={child.coinsBalance}
        />
        <StatCard
          icon={<IconCoin />}
          tone="lilac"
          label="Зароблено всього"
          value={child.coinsEarnedTotal}
        />
        <StatCard icon={<IconZap />} tone="amber" label="Усього XP" value={child.xp} />
      </div>

      <SectionCard title="Що відбувалось">
        {history.length === 0 ? (
          <EmptyState
            icon={<IconCoin className="h-7 w-7" />}
            title="Поки нічого не нараховано"
            hint="Виконуй квести — і батьки підтвердять твої перші нагороди."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-line)]">
            {history.map((entry) => {
              const isPayout = entry.reason === "PAYOUT";
              const isXp = entry.kind === "XP";

              return (
                <li key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className="fq-icon-tile !h-9 !w-9"
                    style={
                      isXp
                        ? {
                            background: "var(--color-brand-soft)",
                            color: "var(--color-brand-ink)",
                          }
                        : {
                            background: "var(--color-mint-soft)",
                            color: "var(--color-mint-ink)",
                          }
                    }
                  >
                    {isXp ? <IconZap className="h-4 w-4" /> : <IconCoin className="h-4 w-4" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {isPayout
                        ? `Батьки видали коіни${entry.note ? ` — ${entry.note}` : ""}`
                        : (entry.task?.title ?? "Підтверджене завдання")}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {formatShortDate(entry.createdAt, now)}
                    </p>
                  </div>

                  <Pill tone={isPayout ? "grey" : isXp ? "lilac" : "mint"}>
                    {entry.amount > 0 ? `+${entry.amount}` : entry.amount} {isXp ? "XP" : ""}
                  </Pill>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
