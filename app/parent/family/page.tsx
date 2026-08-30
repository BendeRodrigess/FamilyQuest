import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelInfo } from "@/lib/levels";
import { EmptyState, SectionCard } from "@/components/ui";
import { IconFamily } from "@/components/icons";
import { AddChildForm } from "@/components/parent/AddChildForm";
import { ChildCard, type ChildSummary } from "@/components/parent/ChildCard";

export default async function ParentFamilyPage() {
  const parent = await requireParent();

  const children = await prisma.user.findMany({
    where: { familyId: parent.familyId, role: "CHILD" },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { assignedTasks: { where: { status: { in: ["ACTIVE", "REJECTED"] } } } },
      },
    },
  });

  const summaries: ChildSummary[] = children.map((child) => {
    const info = levelInfo(child.xp);
    return {
      id: child.id,
      displayName: child.displayName,
      username: child.username ?? "",
      avatarColor: child.avatarColor,
      level: info.level,
      xp: child.xp,
      xpIntoLevel: info.xpIntoLevel,
      xpForNextLevel: info.xpForNextLevel,
      progress: info.progress,
      coinsBalance: child.coinsBalance,
      coinsEarnedTotal: child.coinsEarnedTotal,
      activeTasks: child._count.assignedTasks,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">Моя сім&apos;я</h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Кожна дитина має власний логін і заходить зі свого пристрою.
        </p>
      </header>

      <SectionCard title="Діти">
        <div className="mb-4">
          <AddChildForm />
        </div>

        {summaries.length === 0 ? (
          <EmptyState
            icon={<IconFamily className="h-7 w-7" />}
            title="Тут поки порожньо"
            hint="Додай першу дитину — і зможеш створювати для неї завдання."
          />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {summaries.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
