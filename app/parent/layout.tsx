import type { ReactNode } from "react";

import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncTaskStatuses } from "@/lib/tasks";
import { generateTodayTasks } from "@/lib/templates";
import { AppShell } from "@/components/AppShell";
import { TimeZoneSync } from "@/components/TimeZoneSync";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const parent = await requireParent();

  // При кожному вході видаємо повторювані завдання на сьогодні
  // й перераховуємо прострочення — окремий планувальник не потрібен.
  await generateTodayTasks(parent.familyId);
  await syncTaskStatuses(parent.familyId);

  const [pendingTasks, pendingRedemptions] = await Promise.all([
    prisma.task.count({
      where: { familyId: parent.familyId, status: "PENDING_REVIEW" },
    }),
    prisma.rewardRedemption.count({
      where: { familyId: parent.familyId, status: "PENDING" },
    }),
  ]);

  return (
    <AppShell
      user={{
        displayName: parent.displayName,
        subtitle: "Батьки",
        avatarColor: parent.avatarColor,
        role: "PARENT",
      }}
      badges={{ tasks: pendingTasks, rewards: pendingRedemptions }}
    >
      {/* Зона пристрою потрібна серверу для повторюваних завдань і серії. */}
      <TimeZoneSync current={parent.timeZone} />
      {children}
    </AppShell>
  );
}
