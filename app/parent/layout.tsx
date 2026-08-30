import type { ReactNode } from "react";

import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncTaskStatuses } from "@/lib/tasks";
import { generateTodayTasks } from "@/lib/templates";
import { AppShell } from "@/components/AppShell";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const parent = await requireParent();

  // При кожному вході видаємо повторювані завдання на сьогодні
  // й перераховуємо прострочення — окремий планувальник не потрібен.
  await generateTodayTasks(parent.familyId);
  await syncTaskStatuses(parent.familyId);

  const pendingCount = await prisma.task.count({
    where: { familyId: parent.familyId, status: "PENDING_REVIEW" },
  });

  return (
    <AppShell
      user={{
        displayName: parent.displayName,
        subtitle: "Батьки",
        avatarColor: parent.avatarColor,
        role: "PARENT",
      }}
      badge={pendingCount}
    >
      {children}
    </AppShell>
  );
}
