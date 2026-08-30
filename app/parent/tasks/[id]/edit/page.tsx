import { notFound, redirect } from "next/navigation";

import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDateTimeLocalValue } from "@/lib/format";
import { SectionCard } from "@/components/ui";
import { TaskForm } from "@/components/parent/TaskForm";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const parent = await requireParent();
  const { id } = await params;

  const [task, children] = await Promise.all([
    prisma.task.findFirst({ where: { id, familyId: parent.familyId } }),
    prisma.user.findMany({
      where: { familyId: parent.familyId, role: "CHILD" },
      orderBy: { createdAt: "asc" },
      select: { id: true, displayName: true },
    }),
  ]);

  if (!task) notFound();
  // Підтвердження остаточне — редагувати зараховане завдання нема сенсу.
  if (task.status === "DONE") redirect("/parent/tasks?filter=done");

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
          Редагувати завдання
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Перенесення дедлайну в майбутнє знімає статус «прострочене».
        </p>
      </header>

      <SectionCard title="Деталі">
        <TaskForm
          mode="edit"
          childOptions={children}
          values={{
            taskId: task.id,
            childId: task.childId,
            title: task.title,
            description: task.description ?? "",
            dueAtLocal: toDateTimeLocalValue(task.dueAt),
            xpReward: task.xpReward,
            coinReward: task.coinReward,
          }}
        />
      </SectionCard>
    </div>
  );
}
