import { requireChild } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { levelInfo, xpToAdvanceFrom } from "@/lib/levels";
import { SectionCard } from "@/components/ui";
import { ThemeChoice } from "@/components/theme/ThemeChoice";
import { IconLogout } from "@/components/icons";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function ChildSettingsPage() {
  const child = await requireChild();
  const info = levelInfo(child.xp);

  const upcoming = [info.level, info.level + 1, info.level + 2].map((level) => ({
    level,
    need: xpToAdvanceFrom(level),
  }));

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
          Налаштування
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">Твій профіль і правила гри.</p>
      </header>

      <SectionCard title="Мій профіль">
        <div className="mb-4">
          <p className="text-sm text-[var(--color-muted)]">Логін</p>
          <p className="font-semibold">{child.username}</p>
        </div>
        <ChangePasswordForm />
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Якщо забудеш пароль — попроси батьків, вони задають новий.
        </p>
      </SectionCard>

      <SectionCard title="Вигляд">
        <ThemeChoice />
      </SectionCard>

      <SectionCard title="Як рахуються рівні">
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          XP нікуди не зникає — він тільки накопичується. Але кожен наступний рівень трохи
          дорожчий за попередній.
        </p>

        <ul className="flex flex-col divide-y divide-[var(--color-line)]">
          {upcoming.map(({ level, need }) => (
            <li key={level} className="flex items-center justify-between py-2.5 text-sm first:pt-0">
              <span className="text-[var(--color-ink-soft)]">
                Рівень {level} → {level + 1}
              </span>
              <span className="font-bold">{need} XP</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Вихід">
        <form action={logoutAction}>
          <button type="submit" className="fq-btn fq-btn-outline">
            <IconLogout className="h-[1.15rem] w-[1.15rem]" />
            Вийти
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
