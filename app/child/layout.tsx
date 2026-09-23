import type { ReactNode } from "react";

import { requireChild } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncTaskStatuses } from "@/lib/tasks";
import { generateTodayTasks } from "@/lib/templates";
import { levelInfo } from "@/lib/levels";
import { unreadCount } from "@/lib/notifications/query";
import { AppShell } from "@/components/AppShell";
import { TimeZoneSync } from "@/components/TimeZoneSync";

export default async function ChildLayout({ children }: { children: ReactNode }) {
  const child = await requireChild();

  await generateTodayTasks(child.familyId);
  await syncTaskStatuses(child.familyId);

  const [activeCount, unread] = await Promise.all([
    prisma.task.count({
      where: { childId: child.id, status: { in: ["ACTIVE", "REJECTED"] } },
    }),
    unreadCount(child.id),
  ]);

  const info = levelInfo(child.xp);

  return (
    <AppShell
      user={{
        displayName: child.displayName,
        subtitle: `Дитина · рівень ${info.level}`,
        avatarColor: child.avatarColor,
        role: "CHILD",
      }}
      badges={{ tasks: activeCount, notifications: unread }}
    >
      {/* Зона пристрою потрібна серверу для повторюваних завдань і серії. */}
      <TimeZoneSync current={child.timeZone} />
      {children}
    </AppShell>
  );
}
