import Link from "next/link";

import { requireChild } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lostAt, syncTaskStatuses, DEFAULT_GRACE_MINUTES } from "@/lib/tasks";
import { formatDueLabel, formatTimeLeftPhrase } from "@/lib/format";
import type { TaskStatus } from "@/lib/domain";
import { IconSparkles } from "@/components/icons";
import { EmptyState, SectionCard } from "@/components/ui";
import { QuestCard, type Quest } from "@/components/child/QuestCard";

const FILTERS = [
  { key: "open", label: "Активні", statuses: ["ACTIVE", "REJECTED"] },
  { key: "review", label: "На перевірці", statuses: ["PENDING_REVIEW"] },
  { key: "done", label: "Виконані", statuses: ["DONE"] },
  { key: "missed", label: "Прострочені", statuses: ["OVERDUE"] },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default async function ChildTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; task?: string }>;
}) {
  const child = await requireChild();
  const params = await searchParams;
  const now = new Date();
  const zone = child.timeZone;

  // Статуси синхронізуємо тут, а не лише в лейауті: лейаут і сторінка
  // рендеряться паралельно, тож сторінка могла прочитати завдання ще до
  // того, як прострочене стане простроченим. Раніше це було непомітно, а
  // з живим таймером — ні: перетнувши дедлайн, він одразу просить
  // перемалювати сторінку.
  await syncTaskStatuses(child.familyId);

  const activeFilter: FilterKey =
    (FILTERS.find((f) => f.key === params.filter)?.key as FilterKey) ?? "open";
  const statuses = FILTERS.find((f) => f.key === activeFilter)!.statuses;

  const [tasks, counts] = await Promise.all([
    prisma.task.findMany({
      where: { childId: child.id, status: { in: [...statuses] } },
      orderBy: activeFilter === "done" ? { reviewedAt: "desc" } : { dueAt: "asc" },
      take: 100,
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { childId: child.id },
      _count: { _all: true },
    }),
  ]);

  const countByStatus = new Map(counts.map((row) => [row.status, row._count._all]));
  const grace = child.family.overdueGraceMinutes ?? DEFAULT_GRACE_MINUTES;

  const quests: Quest[] = tasks.map((task) => ({
    taskId: task.id,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    dueAtIso: task.dueAt.toISOString(),
    dueLabel: formatDueLabel(task.dueAt, now, zone),
    timeLeft: formatTimeLeftPhrase(task.dueAt, now),
    parentComment: task.parentComment,
    xp: task.xpReward,
    coins: task.coinReward,
    lostAtIso: task.status === "OVERDUE" ? lostAt(task.dueAt, grace).toISOString() : null,
    autoApprove: task.autoApprove,
    repeating: task.templateId !== null,
    // ?task= приходить зі сповіщення «Нове завдання».
    highlight: task.id === params.task,
  }));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">Мої квести</h1>
        <p className="mt-1 text-[var(--color-muted)]">Усе, що тобі дали батьки.</p>
      </header>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {FILTERS.map((filter) => {
          const isActive = filter.key === activeFilter;
          const count = filter.statuses.reduce(
            (sum, status) => sum + (countByStatus.get(status) ?? 0),
            0,
          );
          return (
            <Link
              key={filter.key}
              href={`/child/tasks?filter=${filter.key}`}
              className={`fq-pill shrink-0 px-3.5 py-2 ${
                isActive ? "fq-pill-lilac" : "fq-pill-grey"
              }`}
            >
              {filter.label}
              <span className="opacity-65">{count}</span>
            </Link>
          );
        })}
      </nav>

      <SectionCard title={FILTERS.find((f) => f.key === activeFilter)!.label}>
        {quests.length === 0 ? (
          <EmptyState
            icon={<IconSparkles className="h-7 w-7" />}
            title="Тут порожньо"
            hint="У цьому розділі поки нічого немає."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {quests.map((quest) => (
              <QuestCard key={quest.taskId} quest={quest} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
