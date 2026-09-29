import { requireParent } from "@/lib/auth";
import { buildFeed } from "@/lib/notifications/feed";
import { SectionCard } from "@/components/ui";
import { NotificationList } from "@/components/notifications/NotificationList";

export default async function ParentNotificationsPage() {
  const parent = await requireParent();
  const now = new Date();

  // Адресат і роль — виключно з сесії. Жодного ID з боку клієнта:
  // саме роль вирішує, які новини цей користувач узагалі бачить.
  const items = await buildFeed(parent.id, parent.role, parent.timeZone, now);

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">Сповіщення</h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Що відбувається із завданнями й винагородами сім&apos;ї.
        </p>
      </header>

      <SectionCard title="Останні">
        <NotificationList items={items} />
      </SectionCard>
    </div>
  );
}
