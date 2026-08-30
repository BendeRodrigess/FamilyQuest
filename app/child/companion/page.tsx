import { requireChild } from "@/lib/auth";
import { levelInfo } from "@/lib/levels";
import { getCompanion, getRoom } from "@/lib/companion/service";
import { speciesById, upcomingUnlocks } from "@/lib/companion/catalog";
import { MOOD_LABEL, MOOD_LINE, moodOf, type Needs } from "@/lib/companion/state";
import { Pill, SectionCard } from "@/components/ui";
import { AdoptCompanion } from "@/components/companion/AdoptCompanion";
import { CompanionRoom } from "@/components/companion/CompanionRoom";
import { NeedBars } from "@/components/companion/NeedBars";
import { CareButtons } from "@/components/companion/CareButtons";
import { RoomEditor } from "@/components/companion/RoomEditor";

export default async function ChildCompanionPage() {
  const child = await requireChild();
  const companion = await getCompanion(child.id);

  if (!companion) {
    return (
      <div className="mx-auto flex max-w-[560px] flex-col gap-5">
        <header>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
            Обери улюбленця
          </h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Він житиме у твоїй кімнаті. За кожен виконаний квест ти отримуватимеш зірочку,
            щоб про нього подбати.
          </p>
        </header>

        <SectionCard title="Хто це буде?">
          <AdoptCompanion />
        </SectionCard>
      </div>
    );
  }

  const room = await getRoom(child.id);
  const needs: Needs = {
    fullness: companion.fullness,
    mood: companion.mood,
    energy: companion.energy,
  };

  const mood = moodOf(needs);
  const info = levelInfo(child.xp);
  const species = speciesById(companion.species);
  const unlocks = upcomingUnlocks(info.level);

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
            {companion.name}
          </h1>
          <p className="mt-1 text-[var(--color-muted)]">
            {species.name} · {MOOD_LABEL[mood]}
          </p>
        </div>
        <Pill tone="amber">⭐ {child.careStars}</Pill>
      </header>

      <CompanionRoom
        room={room}
        species={companion.species}
        name={companion.name}
        sleeping={mood === "sleepy"}
        hungry={needs.fullness < 50}
      />

      <p className="rounded-[var(--radius-inner)] bg-[var(--color-brand-soft)] px-4 py-3 text-center font-semibold text-[var(--color-brand-ink)]">
        {MOOD_LINE[mood]}
      </p>

      <SectionCard title="Як він почувається">
        <NeedBars needs={needs} />
      </SectionCard>

      <SectionCard title="Подбати">
        <CareButtons needs={needs} careStars={child.careStars} />
      </SectionCard>

      <SectionCard title="Облаштувати кімнату">
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          Нові речі відкриваються з рівнем. Зараз у тебе рівень {info.level} — XP нікуди не
          витрачається, він просто відмикає нове.
        </p>
        <RoomEditor room={room} level={info.level} />
      </SectionCard>

      {unlocks.length > 0 && (
        <SectionCard title="Що відкриється далі">
          <ul className="flex flex-col divide-y divide-[var(--color-line)]">
            {unlocks.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0">
                <span className="text-[var(--color-ink-soft)]">{item.name}</span>
                <Pill tone="grey">рівень {item.unlockLevel}</Pill>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
