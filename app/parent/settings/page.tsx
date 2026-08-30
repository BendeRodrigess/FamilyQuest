import { requireParent } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { BASE_XP, XP_STEP, xpToAdvanceFrom } from "@/lib/levels";
import { SectionCard } from "@/components/ui";
import { ThemeChoice } from "@/components/theme/ThemeChoice";
import { IconLogout } from "@/components/icons";
import { FamilyNameForm } from "@/components/parent/FamilyNameForm";

export default async function ParentSettingsPage() {
  const parent = await requireParent();

  const levels = [1, 2, 3, 4, 5].map((level) => ({
    level,
    need: xpToAdvanceFrom(level),
  }));

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
          Налаштування
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">Акаунт сім&apos;ї та правила гри.</p>
      </header>

      <SectionCard title="Сім'я">
        <FamilyNameForm defaultName={parent.family.name} />

        <div className="mt-5 border-t border-[var(--color-line)] pt-4">
          <p className="text-sm text-[var(--color-muted)]">Батьківський акаунт</p>
          <p className="font-semibold">{parent.email}</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Це спільний акаунт: під ним заходять усі дорослі в сім&apos;ї. Окремі акаунти для
            мами й тата з&apos;являться пізніше.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Вигляд">
        <ThemeChoice />
      </SectionCard>

      <SectionCard title="Як працюють рівні">
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          XP ніколи не витрачається й не зникає — він лише накопичується. Поріг кожного
          наступного рівня зростає на {XP_STEP} XP, починаючи з {BASE_XP}.
        </p>

        <ul className="flex flex-col divide-y divide-[var(--color-line)]">
          {levels.map(({ level, need }) => (
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
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          Дитячі акаунти виходять зі своїх пристроїв самостійно.
        </p>
        <form action={logoutAction}>
          <button type="submit" className="fq-btn fq-btn-outline">
            <IconLogout className="h-[1.15rem] w-[1.15rem]" />
            Вийти з акаунта
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
