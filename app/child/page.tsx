import Link from "next/link";

import { requireChild } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelInfo } from "@/lib/levels";
import { formatDueLabel, formatTimeLeft, vocative } from "@/lib/format";
import type { TaskStatus } from "@/lib/domain";
import { IconCheck, IconCoin, IconSparkles, IconZap } from "@/components/icons";
import { EmptyState, ProgressBar, SectionCard, StatCard } from "@/components/ui";
import { QuestCard, type Quest } from "@/components/child/QuestCard";

function questsPhrase(count: number): string {
  if (count === 0) return "Активних квестів немає — можна відпочити.";
  if (count === 1) return "Сьогодні на тебе чекає один квест.";
  if (count < 5) return `Сьогодні на тебе чекають ${count} квести.`;
  return `Сьогодні на тебе чекають ${count} квестів.`;
}

export default async function ChildHomePage() {
  const child = await requireChild();
  const now = new Date();

  const [openTasks, pendingTasks, doneCount] = await Promise.all([
    prisma.task.findMany({
      where: { childId: child.id, status: { in: ["ACTIVE", "REJECTED"] } },
      orderBy: { dueAt: "asc" },
    }),
    prisma.task.findMany({
      where: { childId: child.id, status: "PENDING_REVIEW" },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.task.count({ where: { childId: child.id, status: "DONE" } }),
  ]);

  const info = levelInfo(child.xp);

  const toQuest = (task: (typeof openTasks)[number]): Quest => ({
    taskId: task.id,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    dueLabel: formatDueLabel(task.dueAt, now),
    timeLeft: formatTimeLeft(task.dueAt, now),
    parentComment: task.parentComment,
    xp: task.xpReward,
    coins: task.coinReward,
  });

  const quests = openTasks.map(toQuest);
  const pending = pendingTasks.map(toQuest);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
          Привіт, {vocative(child.displayName)}! <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">{questsPhrase(quests.length)}</p>
      </header>

      {/* Прогрес — головний емоційний блок дитячого екрана */}
      <section className="rounded-[var(--radius-card)] bg-[var(--color-brand-soft)] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--color-brand-ink)]">Твій прогрес</p>
            <p className="mt-0.5 mb-4 text-[1.75rem] leading-tight font-extrabold">
              Рівень {info.level}
            </p>

            <ProgressBar value={info.progress} />

            <p className="mt-2 text-sm text-[var(--color-brand-ink)]">
              {info.xpIntoLevel} / {info.xpForNextLevel} XP до наступного рівня
            </p>
          </div>

          <div className="hidden h-[104px] w-[104px] shrink-0 flex-col items-center justify-center rounded-full bg-[var(--color-surface)] sm:flex">
            <span className="text-xs font-semibold text-[var(--color-muted)]">рівень</span>
            <span className="text-[1.75rem] leading-none font-extrabold text-[var(--color-brand-ink)]">
              {info.level}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<IconZap />} tone="lilac" label="Усього XP" value={child.xp} />
        <StatCard
          icon={<IconCoin />}
          tone="mint"
          label="Мої коіни"
          value={child.coinsBalance}
        />
        <StatCard icon={<IconCheck />} tone="amber" label="Виконано" value={doneCount} />
      </div>

      <SectionCard
        title="Мої квести"
        action={
          <Link href="/child/tasks" className="text-sm font-bold text-[var(--color-brand-ink)]">
            Усі квести
          </Link>
        }
      >
        {quests.length === 0 ? (
          <EmptyState
            icon={<IconSparkles className="h-7 w-7" />}
            title="Зараз немає активних квестів"
            hint="Щойно батьки створять нове завдання, воно з'явиться тут."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {quests.map((quest) => (
              <QuestCard key={quest.taskId} quest={quest} />
            ))}
          </div>
        )}
      </SectionCard>

      {pending.length > 0 && (
        <SectionCard title="Чекають на перевірку">
          <div className="flex flex-col gap-3">
            {pending.map((quest) => (
              <QuestCard key={quest.taskId} quest={quest} />
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
