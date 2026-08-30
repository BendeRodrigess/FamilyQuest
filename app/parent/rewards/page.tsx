import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCoins, formatShortDate } from "@/lib/format";
import { IconCoin, IconRewards } from "@/components/icons";
import { Avatar, EmptyState, Pill, SectionCard, StatCard } from "@/components/ui";
import { PayoutForm } from "@/components/parent/PayoutForm";

export default async function ParentRewardsPage() {
  const parent = await requireParent();
  const familyId = parent.familyId;
  const now = new Date();

  const [children, history, totals] = await Promise.all([
    prisma.user.findMany({
      where: { familyId, role: "CHILD" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.ledgerEntry.findMany({
      where: { familyId, kind: "COIN" },
      include: { child: true, task: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.ledgerEntry.groupBy({
      by: ["reason"],
      where: { familyId, kind: "COIN" },
      _sum: { amount: true },
    }),
  ]);

  const earned = totals.find((t) => t.reason === "TASK_APPROVED")?._sum.amount ?? 0;
  const paidOut = Math.abs(totals.find((t) => t.reason === "PAYOUT")?._sum.amount ?? 0);
  const outstanding = children.reduce((sum, child) => sum + child.coinsBalance, 0);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">Винагороди</h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Коіни — внутрішня валюта сім&apos;ї. Скільки вони варті насправді, вирішуєте ви.
        </p>
      </header>

      {children.length === 0 ? (
        <SectionCard title="Коіни">
          <EmptyState
            icon={<IconRewards className="h-7 w-7" />}
            title="Поки немає дітей"
            hint="Додай дитину, щоб почати нараховувати коіни."
          />
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard icon={<IconCoin />} tone="mint" label="Зароблено всього" value={earned} />
            <StatCard icon={<IconCoin />} tone="lilac" label="Вже виплачено" value={paidOut} />
            <StatCard icon={<IconCoin />} tone="amber" label="Треба видати" value={outstanding} />
          </div>

          <SectionCard title="По дітях">
            <div className="grid gap-3 xl:grid-cols-2">
              {children.map((child) => (
                <div key={child.id} className="fq-card-flat p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar name={child.displayName} color={child.avatarColor} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{child.displayName}</p>
                      <p className="text-sm text-[var(--color-muted)]">
                        Зароблено всього: {child.coinsEarnedTotal}
                      </p>
                    </div>
                    <Pill tone="mint">{formatCoins(child.coinsBalance)}</Pill>
                  </div>

                  <PayoutForm childId={child.id} balance={child.coinsBalance} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Історія">
            {history.length === 0 ? (
              <EmptyState
                icon={<IconCoin className="h-7 w-7" />}
                title="Історія порожня"
                hint="Тут з'являться нарахування за підтверджені завдання і ваші виплати."
              />
            ) : (
              <ul className="flex flex-col divide-y divide-[var(--color-line)]">
                {history.map((entry) => {
                  const isPayout = entry.reason === "PAYOUT";
                  return (
                    <li key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar
                        name={entry.child.displayName}
                        color={entry.child.avatarColor}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {isPayout
                            ? `Виплата${entry.note ? ` — ${entry.note}` : ""}`
                            : (entry.task?.title ?? "Підтверджене завдання")}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {entry.child.displayName} · {formatShortDate(entry.createdAt, now)}
                        </p>
                      </div>
                      <Pill tone={isPayout ? "grey" : "mint"}>
                        {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                      </Pill>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
