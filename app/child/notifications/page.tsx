import { requireChild } from "@/lib/auth";
import { listNotifications } from "@/lib/notifications/query";
import { formatSubmittedLabel } from "@/lib/format";
import { SectionCard } from "@/components/ui";
import {
  NotificationList,
  type NotificationItem,
} from "@/components/notifications/NotificationList";

export default async function ChildNotificationsPage() {
  const child = await requireChild();
  const now = new Date();

  // Адресат — виключно з сесії. Жодного ID з боку клієнта.
  const notifications = await listNotifications(child.id);

  const items: NotificationItem[] = notifications.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    href: item.href,
    createdAtIso: item.createdAt.toISOString(),
    dateLabel: formatSubmittedLabel(item.createdAt, now, child.timeZone),
    read: item.readAt !== null,
  }));

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">Сповіщення</h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Усе, що сталося з твоїми квестами.
        </p>
      </header>

      <SectionCard title="Останні">
        <NotificationList items={items} />
      </SectionCard>
    </div>
  );
}
