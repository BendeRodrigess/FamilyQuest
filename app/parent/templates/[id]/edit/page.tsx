import { notFound } from "next/navigation";

import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionCard } from "@/components/ui";
import { TemplateForm } from "@/components/parent/TemplateForm";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const parent = await requireParent();
  const { id } = await params;

  const [template, children] = await Promise.all([
    prisma.taskTemplate.findFirst({ where: { id, familyId: parent.familyId } }),
    prisma.user.findMany({
      where: { familyId: parent.familyId, role: "CHILD" },
      orderBy: { createdAt: "asc" },
      select: { id: true, displayName: true },
    }),
  ]);

  if (!template) notFound();

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
          Повторюване завдання
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Зміни діють із наступного разу — уже видані завдання лишаються як були.
        </p>
      </header>

      <SectionCard title="Деталі">
        <TemplateForm
          mode="edit"
          childOptions={children}
          values={{
            templateId: template.id,
            childId: template.childId,
            title: template.title,
            description: template.description ?? "",
            dueTime: template.dueTime,
            weekdays: template.weekdays,
            xpReward: template.xpReward,
            coinReward: template.coinReward,
            autoApprove: template.autoApprove,
          }}
        />
      </SectionCard>
    </div>
  );
}
