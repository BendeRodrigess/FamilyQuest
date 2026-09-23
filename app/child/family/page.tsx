import { requireChild } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelInfo } from "@/lib/levels";
import { currentStreak, streakLabel } from "@/lib/streak";
import { IconFamily, IconFlame } from "@/components/icons";
import { Avatar, EmptyState, Pill, ProgressBar, SectionCard } from "@/components/ui";

export default async function ChildFamilyPage() {
  const child = await requireChild();
  const now = new Date();

  if (!child.family.showSiblingProgress) {
    return (
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
            Моя сім&apos;я
          </h1>
        </header>

        <SectionCard title="Прогрес прихований">
          <EmptyState
            icon={<IconFamily className="h-7 w-7" />}
            title="Батьки вимкнули показ чужого прогресу"
            hint="Свій рівень і квести ти завжди бачиш на головній."
          />
        </SectionCard>
      </div>
    );
  }

  const children = await prisma.user.findMany({
    where: { familyId: child.familyId, role: "CHILD" },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { assignedTasks: { where: { status: "DONE" } } } },
    },
  });

  const rows = await Promise.all(
    children.map(async (member) => ({
      id: member.id,
      name: member.displayName,
      color: member.avatarColor,
      isMe: member.id === child.id,
      info: levelInfo(member.xp),
      xp: member.xp,
      done: member._count.assignedTasks,
      streak: await currentStreak(member.id, now),
    })),
  );

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
          Моя сім&apos;я
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Хто на якому рівні. Коіни — особиста справа кожного, тут їх не видно.
        </p>
      </header>

      <SectionCard title="Прогрес">
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <article
              key={row.id}
              className={`fq-card-flat p-4 ${
                row.isMe ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar name={row.name} color={row.color} size="lg" />

                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <h2 className="font-extrabold">{row.name}</h2>
                    {row.isMe && <Pill tone="lilac">це ти</Pill>}
                    {row.streak > 1 && (
                      <Pill tone="amber">
                        <IconFlame className="h-3.5 w-3.5" />
                        {streakLabel(row.streak)} поспіль
                      </Pill>
                    )}
                  </div>

                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-sm text-[var(--color-muted)]">
                      {row.xp} XP · виконано {row.done}
                    </span>
                    <span className="shrink-0 text-sm font-bold">Рівень {row.info.level}</span>
                  </div>

                  <ProgressBar value={row.info.progress} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
