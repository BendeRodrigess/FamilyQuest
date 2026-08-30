import Link from "next/link";

import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelInfo } from "@/lib/levels";
import { formatSubmittedLabel } from "@/lib/format";
import { IconClipboard, IconClock, IconCoin, IconInbox, IconPlus, IconFamily } from "@/components/icons";
import { Avatar, EmptyState, ProgressBar, SectionCard, StatCard } from "@/components/ui";
import { ReviewCard, type ReviewItem } from "@/components/parent/ReviewCard";
import { RedemptionCard, type RedemptionItem } from "@/components/parent/RedemptionCard";

export default async function ParentHomePage() {
  const parent = await requireParent();
  const familyId = parent.familyId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [children, pendingTasks, activeCount, monthCoins, pendingRedemptions] = await Promise.all([
    prisma.user.findMany({
      where: { familyId, role: "CHILD" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.task.findMany({
      where: { familyId, status: "PENDING_REVIEW" },
      include: { child: true },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.task.count({ where: { familyId, status: { in: ["ACTIVE", "REJECTED"] } } }),
    prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        familyId,
        kind: "COIN",
        reason: "TASK_APPROVED",
        createdAt: { gte: monthStart },
      },
    }),
    prisma.rewardRedemption.findMany({
      where: { familyId, status: "PENDING" },
      include: { child: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const reviewItems: ReviewItem[] = pendingTasks.map((task) => ({
    taskId: task.id,
    title: task.title,
    childName: task.child.displayName,
    childColor: task.child.avatarColor,
    submittedLabel: task.submittedAt ? formatSubmittedLabel(task.submittedAt, now) : "щойно",
    childComment: task.childComment,
    xp: task.xpReward,
    coins: task.coinReward,
  }));

  const redemptionItems: RedemptionItem[] = pendingRedemptions.map((item) => ({
    id: item.id,
    title: item.titleSnapshot,
    emoji: item.emojiSnapshot,
    cost: item.costSnapshot,
    childName: item.child.displayName,
    childColor: item.child.avatarColor,
    requestedLabel: formatSubmittedLabel(item.createdAt, now),
    childNote: item.childNote,
  }));

  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
            Добрий день, {parent.displayName}!
          </h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Ось що відбувається у вашій сім&apos;ї сьогодні.
          </p>
        </div>

        {hasChildren && (
          <Link href="/parent/tasks/new" className="fq-btn fq-btn-primary">
            <IconPlus className="h-[1.15rem] w-[1.15rem]" />
            Нове завдання
          </Link>
        )}
      </header>

      {!hasChildren ? (
        <SectionCard title="Почнемо з дитини">
          <EmptyState
            icon={<IconFamily className="h-7 w-7" />}
            title="У сім'ї ще немає жодної дитини"
            hint="Додай дитину — вона отримає власний логін і зможе заходити зі свого телефона."
          />
          <div className="mt-4 flex justify-center">
            <Link href="/parent/family" className="fq-btn fq-btn-primary">
              <IconPlus className="h-[1.15rem] w-[1.15rem]" />
              Додати дитину
            </Link>
          </div>
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={<IconClipboard />}
              tone="lilac"
              label="Активні завдання"
              value={activeCount}
            />
            <StatCard
              icon={<IconClock />}
              tone="amber"
              label="Чекають перевірки"
              value={pendingTasks.length}
            />
            <StatCard
              icon={<IconCoin />}
              tone="mint"
              label="Винагороди за місяць"
              value={monthCoins._sum.amount ?? 0}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5">
              <SectionCard
                title="Очікують перевірки"
                action={
                  <Link
                    href="/parent/tasks"
                    className="text-sm font-bold text-[var(--color-brand-ink)]"
                  >
                    Усі завдання
                  </Link>
                }
              >
                {reviewItems.length === 0 ? (
                  <EmptyState
                    icon={<IconInbox className="h-7 w-7" />}
                    title="Немає завдань на перевірці"
                    hint="Щойно дитина позначить квест виконаним, він з'явиться тут."
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {reviewItems.map((item) => (
                      <ReviewCard key={item.taskId} item={item} />
                    ))}
                  </div>
                )}
              </SectionCard>

              {redemptionItems.length > 0 && (
                <SectionCard
                  title="Замовлені нагороди"
                  action={
                    <Link
                      href="/parent/rewards"
                      className="text-sm font-bold text-[var(--color-brand-ink)]"
                    >
                      Магазин
                    </Link>
                  }
                >
                  <div className="flex flex-col gap-3">
                    {redemptionItems.map((item) => (
                      <RedemptionCard key={item.id} item={item} />
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>

            <SectionCard
              title="Діти"
              action={
                <Link
                  href="/parent/family"
                  className="text-sm font-bold text-[var(--color-brand-ink)]"
                >
                  Додати
                </Link>
              }
            >
              <div className="flex flex-col gap-4">
                {children.map((child) => {
                  const info = levelInfo(child.xp);
                  return (
                    <div key={child.id} className="flex items-center gap-3">
                      <Avatar name={child.displayName} color={child.avatarColor} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-baseline justify-between gap-2">
                          <p className="truncate font-bold">{child.displayName}</p>
                          <p className="shrink-0 text-sm text-[var(--color-muted)]">
                            Рівень {info.level}
                          </p>
                        </div>
                        <ProgressBar value={info.progress} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
