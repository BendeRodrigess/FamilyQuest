import Link from "next/link";

import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatShortDate, formatSubmittedLabel } from "@/lib/format";
import type { TaskStatus } from "@/lib/domain";
import { IconClipboard, IconEdit, IconPlus } from "@/components/icons";
import { Avatar, EmptyState, RewardPills, SectionCard, StatusPill } from "@/components/ui";
import { ReviewCard } from "@/components/parent/ReviewCard";
import { DeleteTaskButton } from "@/components/parent/DeleteTaskButton";

const FILTERS = [
  { key: "review", label: "На перевірці", statuses: ["PENDING_REVIEW"] },
  { key: "active", label: "Активні", statuses: ["ACTIVE", "REJECTED"] },
  { key: "overdue", label: "Прострочені", statuses: ["OVERDUE"] },
  { key: "done", label: "Виконані", statuses: ["DONE"] },
  { key: "all", label: "Усі", statuses: [] },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default async function ParentTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const parent = await requireParent();
  const params = await searchParams;

  const activeFilter: FilterKey =
    (FILTERS.find((f) => f.key === params.filter)?.key as FilterKey) ?? "review";
  const statuses = FILTERS.find((f) => f.key === activeFilter)!.statuses;

  const now = new Date();

  const [tasks, childCount, counts] = await Promise.all([
    prisma.task.findMany({
      where: {
        familyId: parent.familyId,
        ...(statuses.length > 0 ? { status: { in: [...statuses] } } : {}),
      },
      include: { child: true },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      take: 100,
    }),
    prisma.user.count({ where: { familyId: parent.familyId, role: "CHILD" } }),
    prisma.task.groupBy({
      by: ["status"],
      where: { familyId: parent.familyId },
      _count: { _all: true },
    }),
  ]);

  const countByStatus = new Map(counts.map((row) => [row.status, row._count._all]));
  const countFor = (keys: readonly string[]) =>
    keys.length === 0
      ? counts.reduce((sum, row) => sum + row._count._all, 0)
      : keys.reduce((sum, key) => sum + (countByStatus.get(key) ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">Завдання</h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Усе, що ви створили для дітей, в одному місці.
          </p>
        </div>

        {childCount > 0 && (
          <Link href="/parent/tasks/new" className="fq-btn fq-btn-primary">
            <IconPlus className="h-[1.15rem] w-[1.15rem]" />
            Нове завдання
          </Link>
        )}
      </header>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {FILTERS.map((filter) => {
          const isActive = filter.key === activeFilter;
          const count = countFor(filter.statuses);
          return (
            <Link
              key={filter.key}
              href={`/parent/tasks?filter=${filter.key}`}
              className={`fq-pill shrink-0 px-3.5 py-2 ${
                isActive ? "fq-pill-lilac" : "fq-pill-grey"
              }`}
            >
              {filter.label}
              <span className={isActive ? "opacity-70" : "opacity-60"}>{count}</span>
            </Link>
          );
        })}
      </nav>

      <SectionCard title={FILTERS.find((f) => f.key === activeFilter)!.label}>
        {tasks.length === 0 ? (
          <EmptyState
            icon={<IconClipboard className="h-7 w-7" />}
            title="Тут порожньо"
            hint={
              childCount === 0
                ? "Спершу додай дитину — тоді зможеш створювати завдання."
                : "У цьому розділі поки немає жодного завдання."
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) =>
              task.status === "PENDING_REVIEW" ? (
                <ReviewCard
                  key={task.id}
                  item={{
                    taskId: task.id,
                    title: task.title,
                    childName: task.child.displayName,
                    childColor: task.child.avatarColor,
                    submittedLabel: task.submittedAt
                      ? formatSubmittedLabel(task.submittedAt, now)
                      : "щойно",
                    childComment: task.childComment,
                    xp: task.xpReward,
                    coins: task.coinReward,
                  }}
                />
              ) : (
                <article key={task.id} className="fq-card-flat p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="font-bold leading-snug">{task.title}</h3>
                    <StatusPill status={task.status as TaskStatus} />
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--color-muted)]">
                    <Avatar
                      name={task.child.displayName}
                      color={task.child.avatarColor}
                      size="sm"
                    />
                    <span>{task.child.displayName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatShortDate(task.dueAt, now)}</span>
                  </div>

                  {task.status === "REJECTED" && task.parentComment && (
                    <p className="mb-3 rounded-[var(--radius-control)] bg-[var(--color-rose-soft)] px-3 py-2 text-sm text-[var(--color-rose-ink)]">
                      Твій коментар: «{task.parentComment}»
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <RewardPills xp={task.xpReward} coins={task.coinReward} />
                    </div>

                    {task.status !== "DONE" && (
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/parent/tasks/${task.id}/edit`}
                          className="fq-btn fq-btn-ghost !px-2 !py-1.5"
                          title="Редагувати"
                          aria-label={`Редагувати завдання «${task.title}»`}
                        >
                          <IconEdit className="h-[1.15rem] w-[1.15rem]" />
                        </Link>
                        <DeleteTaskButton taskId={task.id} title={task.title} />
                      </div>
                    )}
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
