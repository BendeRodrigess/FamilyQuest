import { requireChild } from "@/lib/auth";
import { buildFeed } from "@/lib/notifications/feed";
import { SectionCard } from "@/components/ui";
import { NotificationList } from "@/components/notifications/NotificationList";

export default async function ChildNotificationsPage() {
  const child = await requireChild();
  const now = new Date();

  // Адресат і роль — виключно з сесії. Жодного ID з боку клієнта:
  // саме роль вирішує, які новини цей користувач узагалі бачить.
  const items = await buildFeed(child.id, child.role, child.timeZone, now);

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
