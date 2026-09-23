import Link from "next/link";

import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCoins, formatShortDate, formatSubmittedLabel } from "@/lib/format";
import { REDEMPTION_STATUS_LABEL, REDEMPTION_STATUS_TONE, type RedemptionStatus } from "@/lib/domain";
import { IconCoin, IconPlus, IconRewards } from "@/components/icons";
import { Avatar, EmptyState, Pill, SectionCard, StatCard } from "@/components/ui";
import { LocalDateTime } from "@/components/LocalDateTime";
import { PayoutForm } from "@/components/parent/PayoutForm";
import { RewardCard, type RewardSummary } from "@/components/parent/RewardCard";
import { RedemptionCard, type RedemptionItem } from "@/components/parent/RedemptionCard";

const LEDGER_REASON_LABEL: Record<string, string> = {
  TASK_APPROVED: "Підтверджене завдання",
  PAYOUT: "Виплата",
  REWARD_REDEEMED: "Обмін на нагороду",
  REWARD_REFUNDED: "Повернення за нагороду",
};

export default async function ParentRewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const parent = await requireParent();
  const familyId = parent.familyId;
  const params = await searchParams;
  const tab = params.tab === "shop" ? "shop" : "coins";
  const now = new Date();
  const zone = parent.timeZone;

  const [children, pending, rewards, history, totals, recentRedemptions] = await Promise.all([
    prisma.user.findMany({
      where: { familyId, role: "CHILD" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.rewardRedemption.findMany({
      where: { familyId, status: "PENDING" },
      include: { child: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.reward.findMany({
      where: { familyId },
      orderBy: [{ isActive: "desc" }, { costCoins: "asc" }],
      include: { _count: { select: { redemptions: true } } },
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
    prisma.rewardRedemption.findMany({
      where: { familyId, status: { in: ["FULFILLED", "DECLINED"] } },
      include: { child: true },
      orderBy: { decidedAt: "desc" },
      take: 15,
    }),
  ]);

  const sumFor = (reason: string) =>
    Math.abs(totals.find((t) => t.reason === reason)?._sum.amount ?? 0);

  const earned = sumFor("TASK_APPROVED");
  const paidOut = sumFor("PAYOUT");
  const spent = sumFor("REWARD_REDEEMED") - sumFor("REWARD_REFUNDED");
  const outstanding = children.reduce((sum, child) => sum + child.coinsBalance, 0);

  const queue: RedemptionItem[] = pending.map((item) => ({
    id: item.id,
    title: item.titleSnapshot,
    emoji: item.emojiSnapshot,
    cost: item.costSnapshot,
    childName: item.child.displayName,
    childColor: item.child.avatarColor,
    requestedAtIso: item.createdAt.toISOString(),
    requestedLabel: formatSubmittedLabel(item.createdAt, now, zone),
    childNote: item.childNote,
  }));

  const shopItems: RewardSummary[] = rewards.map((reward) => ({
    id: reward.id,
    title: reward.title,
    description: reward.description,
    emoji: reward.emoji,
    costCoins: reward.costCoins,
    isActive: reward.isActive,
    timesRedeemed: reward._count.redemptions,
  }));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">Винагороди</h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Коіни — внутрішня валюта сім&apos;ї. Обміняти їх дитина може на те, що ви
            виставите в магазині.
          </p>
        </div>

        {tab === "shop" && (
          <Link href="/parent/rewards/new" className="fq-btn fq-btn-primary">
            <IconPlus className="h-[1.15rem] w-[1.15rem]" />
            Нова нагорода
          </Link>
        )}
      </header>

      {/* Черга видачі показується завжди — це дія, яка чекає на батьків */}
      {queue.length > 0 && (
        <SectionCard title="Чекають видачі">
          <div className="flex flex-col gap-3">
            {queue.map((item) => (
              <RedemptionCard key={item.id} item={item} />
            ))}
          </div>
        </SectionCard>
      )}

      <nav className="flex gap-2">
        {[
          { key: "coins", label: "Коіни" },
          { key: "shop", label: "Магазин" },
        ].map((item) => (
          <Link
            key={item.key}
            href={`/parent/rewards?tab=${item.key}`}
            className={`fq-pill px-3.5 py-2 ${tab === item.key ? "fq-pill-lilac" : "fq-pill-grey"}`}
          >
            {item.label}
            {item.key === "shop" && <span className="opacity-65">{rewards.length}</span>}
          </Link>
        ))}
      </nav>

      {children.length === 0 ? (
        <SectionCard title="Поки немає дітей">
          <EmptyState
            icon={<IconRewards className="h-7 w-7" />}
            title="Спершу додай дитину"
            hint="Тоді з'явиться кому нараховувати коіни й для кого виставляти нагороди."
          />
        </SectionCard>
      ) : tab === "shop" ? (
        <SectionCard title="Вітрина">
          {shopItems.length === 0 ? (
            <>
              <EmptyState
                icon={<IconRewards className="h-7 w-7" />}
                title="Магазин порожній"
                hint="Додай кілька нагород — годину ігор, похід у кіно, вибір фільму на вечір. Саме заради них коіни й мають сенс."
              />
              <div className="mt-4 flex justify-center">
                <Link href="/parent/rewards/new" className="fq-btn fq-btn-primary">
                  <IconPlus className="h-[1.15rem] w-[1.15rem]" />
                  Додати першу нагороду
                </Link>
              </div>
            </>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {shopItems.map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))}
            </div>
          )}
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<IconCoin />} tone="mint" label="Зароблено всього" value={earned} />
            <StatCard icon={<IconCoin />} tone="lilac" label="Витрачено в магазині" value={spent} />
            <StatCard icon={<IconCoin />} tone="sky" label="Виплачено грошима" value={paidOut} />
            <StatCard icon={<IconCoin />} tone="amber" label="На руках у дітей" value={outstanding} />
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

          {recentRedemptions.length > 0 && (
            <SectionCard title="Опрацьовані заявки">
              <ul className="flex flex-col divide-y divide-[var(--color-line)]">
                {recentRedemptions.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-xl">{item.emojiSnapshot}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.titleSnapshot}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {item.child.displayName} ·{" "}
                        {item.decidedAt ? (
                          <LocalDateTime
                            iso={item.decidedAt.toISOString()}
                            initial={formatShortDate(item.decidedAt, now, zone)}
                          />
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                    <Pill tone={REDEMPTION_STATUS_TONE[item.status as RedemptionStatus]}>
                      {REDEMPTION_STATUS_LABEL[item.status as RedemptionStatus]}
                    </Pill>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <SectionCard title="Рух коінів">
            {history.length === 0 ? (
              <EmptyState
                icon={<IconCoin className="h-7 w-7" />}
                title="Історія порожня"
                hint="Тут з'являться нарахування, обміни й виплати."
              />
            ) : (
              <ul className="flex flex-col divide-y divide-[var(--color-line)]">
                {history.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar
                      name={entry.child.displayName}
                      color={entry.child.avatarColor}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {entry.task?.title ??
                          entry.note ??
                          LEDGER_REASON_LABEL[entry.reason] ??
                          "Операція"}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {entry.child.displayName} · {LEDGER_REASON_LABEL[entry.reason]} ·{" "}
                        <LocalDateTime
                          iso={entry.createdAt.toISOString()}
                          initial={formatShortDate(entry.createdAt, now, zone)}
                        />
                      </p>
                    </div>
                    <Pill tone={entry.amount > 0 ? "mint" : "grey"}>
                      {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                    </Pill>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
