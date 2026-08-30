import type { ReactNode } from "react";

import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncOverdueTasks } from "@/lib/tasks";
import { AppShell } from "@/components/AppShell";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const parent = await requireParent();

  // Прострочення перераховуємо при кожному вході в батьківську частину —
  // окремий планувальник для цього не потрібен.
  await syncOverdueTasks(parent.familyId);

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
