import { redirect } from "next/navigation";

import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDateTimeLocalValue } from "@/lib/format";
import { EVERY_DAY } from "@/lib/domain";
import { SectionCard } from "@/components/ui";
import { NewTaskTabs } from "@/components/parent/NewTaskTabs";

export default async function NewTaskPage() {
  const parent = await requireParent();

  const children = await prisma.user.findMany({
    where: { familyId: parent.familyId, role: "CHILD" },
    orderBy: { createdAt: "asc" },
    select: { id: true, displayName: true },
  });

  // Без жодної дитини створювати завдання нема кому.
  if (children.length === 0) redirect("/parent/family");

  // За замовчуванням — сьогодні о 20:00, а якщо цей час уже минув, то завтра.
  const due = new Date();
  due.setSeconds(0, 0);
  if (due.getHours() >= 20) due.setDate(due.getDate() + 1);
  due.setHours(20, 0, 0, 0);

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
          Нове завдання
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Дитина побачить його одразу після створення.
        </p>
      </header>

      <SectionCard title="Деталі">
        <NewTaskTabs
          childOptions={children}
          taskValues={{
            childId: children[0].id,
            title: "",
            description: "",
            dueAtLocal: toDateTimeLocalValue(due),
            xpReward: 15,
            coinReward: 0,
          }}
          templateValues={{
            childId: children[0].id,
            title: "",
            description: "",
            dueTime: "20:00",
            weekdays: EVERY_DAY,
            xpReward: 10,
            coinReward: 0,
            autoApprove: false,
          }}
        />
      </SectionCard>
    </div>
  );
}
