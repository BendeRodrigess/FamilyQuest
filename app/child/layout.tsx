import type { ReactNode } from "react";

import { requireChild } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncTaskStatuses } from "@/lib/tasks";
import { generateTodayTasks } from "@/lib/templates";
import { levelInfo } from "@/lib/levels";
import { AppShell } from "@/components/AppShell";

export default async function ChildLayout({ children }: { children: ReactNode }) {
  const child = await requireChild();

  await generateTodayTasks(child.familyId);
  await syncTaskStatuses(child.familyId);

  const activeCount = await prisma.task.count({
    where: { childId: child.id, status: { in: ["ACTIVE", "REJECTED"] } },
  });

  const info = levelInfo(child.xp);

  return (
    <AppShell
      user={{
        displayName: child.displayName,
        subtitle: `Дитина · рівень ${info.level}`,
        avatarColor: child.avatarColor,
        role: "CHILD",
      }}
      badges={{ tasks: activeCount }}
    >
      {children}
    </AppShell>
  );
}
