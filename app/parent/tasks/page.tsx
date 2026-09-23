import Link from "next/link";

import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatShortDate, formatSubmittedLabel } from "@/lib/format";
import { describeWeekdays, type TaskStatus } from "@/lib/domain";
import { IconClipboard, IconEdit, IconPlus, IconRepeat } from "@/components/icons";
import { Avatar, EmptyState, Pill, RewardPills, SectionCard, StatusPill } from "@/components/ui";
import { LocalDateTime } from "@/components/LocalDateTime";
import { ReviewCard } from "@/components/parent/ReviewCard";
import { DeleteTaskButton } from "@/components/parent/DeleteTaskButton";
import { TemplateCard, type TemplateSummary } from "@/components/parent/TemplateCard";

const FILTERS = [
  { key: "review", label: "На перевірці", statuses: ["PENDING_REVIEW"] },
  { key: "active", label: "Активні", statuses: ["ACTIVE", "REJECTED"] },
  { key: "repeating", label: "Повторювані", statuses: [] },
  { key: "overdue", label: "Прострочені", statuses: ["OVERDUE", "LOST"] },
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
  const familyId = parent.familyId;

  const activeFilter: FilterKey =
    (FILTERS.find((f) => f.key === params.filter)?.key as FilterKey) ?? "review";
  const filter = FILTERS.find((f) => f.key === activeFilter)!;
  const showTemplates = activeFilter === "repeating";

  const now = new Date();
  const zone = parent.timeZone;

  const [tasks, templates, childCount, counts, templateCount] = await Promise.all([
    showTemplates
      ? Promise.resolve([])
      : prisma.task.findMany({
          where: {
            familyId,
            ...(filter.statuses.length > 0 ? { status: { in: [...filter.statuses] } } : {}),
          },
          include: { child: true },
          orderBy: [{ status: "asc" }, { dueAt: "asc" }],
          take: 100,
        }),
    showTemplates
      ? prisma.taskTemplate.findMany({
          where: { familyId },
          include: { child: true },
          orderBy: [{ isPaused: "asc" }, { createdAt: "asc" }],
        })
      : Promise.resolve([]),
    prisma.user.count({ where: { familyId, role: "CHILD" } }),
    prisma.task.groupBy({
      by: ["status"],
      where: { familyId },
      _count: { _all: true },
    }),
    prisma.taskTemplate.count({ where: { familyId } }),
  ]);

  const countByStatus = new Map(counts.map((row) => [row.status, row._count._all]));

  const countFor = (key: FilterKey, statuses: readonly string[]) => {
    if (key === "repeating") return templateCount;
    if (statuses.length === 0) return counts.reduce((sum, row) => sum + row._count._all, 0);
    return statuses.reduce((sum, status) => sum + (countByStatus.get(status) ?? 0), 0);
  };

  const templateSummaries: TemplateSummary[] = templates.map((template) => ({
    id: template.id,
    title: template.title,
    childName: template.child.displayName,
    childColor: template.child.avatarColor,
    scheduleLabel: describeWeekdays(template.weekdays),
    dueTime: template.dueTime,
    xp: template.xpReward,
    coins: template.coinReward,
    autoApprove: template.autoApprove,
    isPaused: template.isPaused,
  }));

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
        {FILTERS.map((item) => {
          const isActive = item.key === activeFilter;
          return (
            <Link
              key={item.key}
              href={`/parent/tasks?filter=${item.key}`}
              className={`fq-pill shrink-0 px-3.5 py-2 ${
                isActive ? "fq-pill-lilac" : "fq-pill-grey"
              }`}
            >
              {item.label}
              <span className="opacity-65">{countFor(item.key, item.statuses)}</span>
            </Link>
          );
        })}
      </nav>

      <SectionCard title={filter.label}>
        {showTemplates ? (
          templateSummaries.length === 0 ? (
            <EmptyState
              icon={<IconRepeat className="h-7 w-7" />}
              title="Повторюваних завдань ще немає"
              hint="Створи одне — і воно з'являтиметься саме у вибрані дні, без нагадувань з твого боку."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {templateSummaries.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )
        ) : tasks.length === 0 ? (
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
                    submittedAtIso: task.submittedAt?.toISOString() ?? null,
                    submittedLabel: task.submittedAt
                      ? formatSubmittedLabel(task.submittedAt, now, zone)
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
                    <span>
                      <LocalDateTime
                        iso={task.dueAt.toISOString()}
                        initial={formatShortDate(task.dueAt, now, zone)}
                      />
                    </span>
                    {task.templateId && (
                      <Pill tone="sky">
                        <IconRepeat className="h-3.5 w-3.5" />
                        Повторюване
                      </Pill>
                    )}
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
