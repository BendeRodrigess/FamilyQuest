import { requireChild } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/format";
import {
  REDEMPTION_STATUS_LABEL,
  REDEMPTION_STATUS_TONE,
  type RedemptionStatus,
} from "@/lib/domain";
import { IconCoin, IconRewards, IconZap } from "@/components/icons";
import { EmptyState, Pill, SectionCard, StatCard } from "@/components/ui";
import { LocalDateTime } from "@/components/LocalDateTime";
import { ShopCard, type ShopItem } from "@/components/child/ShopCard";

const LEDGER_REASON_LABEL: Record<string, string> = {
  TASK_APPROVED: "За виконане завдання",
  PAYOUT: "Батьки видали коіни",
  REWARD_REDEEMED: "Обмін на нагороду",
  REWARD_REFUNDED: "Повернення — нагороду не видали",
};

export default async function ChildRewardsPage() {
  const child = await requireChild();
  const now = new Date();
  const zone = child.timeZone;

  const [rewards, myRedemptions, history] = await Promise.all([
    prisma.reward.findMany({
      where: { familyId: child.familyId, isActive: true },
      orderBy: { costCoins: "asc" },
    }),
    prisma.rewardRedemption.findMany({
      where: { childId: child.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.ledgerEntry.findMany({
      where: { childId: child.id },
      include: { task: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const shop: ShopItem[] = rewards.map((reward) => ({
    id: reward.id,
    title: reward.title,
    description: reward.description,
    emoji: reward.emoji,
    cost: reward.costCoins,
  }));

  const pending = myRedemptions.filter((r) => r.status === "PENDING");
  const decided = myRedemptions.filter((r) => r.status !== "PENDING");

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">Винагороди</h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Обмінюй коіни на те, що вибрали батьки. XP залишається з тобою назавжди.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<IconCoin />} tone="mint" label="Доступно" value={child.coinsBalance} />
        <StatCard
          icon={<IconCoin />}
          tone="lilac"
          label="Зароблено всього"
          value={child.coinsEarnedTotal}
        />
        <StatCard icon={<IconZap />} tone="amber" label="Усього XP" value={child.xp} />
      </div>

      {pending.length > 0 && (
        <SectionCard title="Замовлено, чекає на батьків">
          <div className="flex flex-col gap-2.5">
            {pending.map((item) => (
              <div key={item.id} className="fq-card-flat flex items-center gap-3 p-3.5">
                <span className="text-xl">{item.emojiSnapshot}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.titleSnapshot}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {item.costSnapshot} коінів ·{" "}
                    <LocalDateTime
                      iso={item.createdAt.toISOString()}
                      initial={formatShortDate(item.createdAt, now, zone)}
                    />
                  </p>
                </div>
                <Pill tone="amber">Очікує видачі</Pill>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Магазин">
        {shop.length === 0 ? (
          <EmptyState
            icon={<IconRewards className="h-7 w-7" />}
            title="Магазин поки порожній"
            hint="Батьки ще не додали нагород. Коіни тим часом продовжують накопичуватись."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {shop.map((item) => (
              <ShopCard key={item.id} item={item} balance={child.coinsBalance} />
            ))}
          </div>
        )}
      </SectionCard>

      {decided.length > 0 && (
        <SectionCard title="Що вже обміняв">
          <ul className="flex flex-col divide-y divide-[var(--color-line)]">
            {decided.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="text-xl">{item.emojiSnapshot}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.titleSnapshot}</p>
                  {item.status === "DECLINED" && item.parentComment ? (
                    <p className="text-xs text-[var(--color-rose-ink)]">
                      «{item.parentComment}» — коіни повернулись
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-muted)]">
                      {item.decidedAt ? (
                        <LocalDateTime
                          iso={item.decidedAt.toISOString()}
                          initial={formatShortDate(item.decidedAt, now, zone)}
                        />
                      ) : (
                        "—"
                      )}
                    </p>
                  )}
                </div>
                <Pill tone={REDEMPTION_STATUS_TONE[item.status as RedemptionStatus]}>
                  {REDEMPTION_STATUS_LABEL[item.status as RedemptionStatus]}
                </Pill>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

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
              const isXp = entry.kind === "XP";
              const positive = entry.amount > 0;

              return (
                <li key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className="fq-icon-tile !h-9 !w-9"
                    style={
                      isXp
                        ? { background: "var(--color-brand-soft)", color: "var(--color-brand-ink)" }
                        : { background: "var(--color-mint-soft)", color: "var(--color-mint-ink)" }
                    }
                  >
                    {isXp ? <IconZap className="h-4 w-4" /> : <IconCoin className="h-4 w-4" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {entry.task?.title ?? entry.note ?? LEDGER_REASON_LABEL[entry.reason]}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {LEDGER_REASON_LABEL[entry.reason]} ·{" "}
                      <LocalDateTime
                        iso={entry.createdAt.toISOString()}
                        initial={formatShortDate(entry.createdAt, now, zone)}
                      />
                    </p>
                  </div>

                  <Pill tone={positive ? (isXp ? "lilac" : "mint") : "grey"}>
                    {positive ? `+${entry.amount}` : entry.amount} {isXp ? "XP" : ""}
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
