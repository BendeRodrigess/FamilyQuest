"use client";

import { careIcon } from "@/lib/companion/sprites";

/**
 * Одна кругла кнопка потреби: показник і дія в одному елементі.
 *
 * Компонент навмисно нічого не знає ні про конкретні потреби, ні про
 * списання зірочок — усе приходить пропсами. Щоб додати в майбутньому
 * чистоту чи здоров'я, достатньо дописати запис у CARE_ACTIONS і покласти
 * піктограму: сюди змін не буде.
 */

export type NeedTone = "good" | "warn" | "bad";

export function toneFor(value: number): NeedTone {
  if (value > 60) return "good";
  if (value > 30) return "warn";
  return "bad";
}

/**
 * Кольори беруться з тих самих токенів, що й решта застосунку, тому
 * панель автоматично працює у світлій і темній темі й не «кислотить».
 */
const TONES: Record<NeedTone, { ring: string; face: string; text: string; border: string }> = {
  good: {
    ring: "var(--color-green)",
    face: "var(--color-green-soft)",
    text: "var(--color-green-ink)",
    border: "var(--color-green)",
  },
  warn: {
    ring: "var(--color-amber-ink)",
    face: "var(--color-amber-soft)",
    text: "var(--color-amber-ink)",
    border: "var(--color-amber-ink)",
  },
  bad: {
    ring: "var(--color-rose-ink)",
    face: "var(--color-rose-soft)",
    text: "var(--color-rose-ink)",
    border: "var(--color-rose-ink)",
  },
};

export type PetNeedButtonProps = {
  /** id дії з CARE_ACTIONS — він же ключ піктограми. */
  actionId: string;
  label: string;
  /** Поточне значення потреби, 0–100. */
  value: number;
  /** Скільки зірочок коштує дія. */
  cost: number;
  /** Чи вистачає зірочок. */
  affordable: boolean;
  /** Потреба вже повна — доглядати нема потреби. */
  full: boolean;
  busy: boolean;
  onPress: () => void;
};

export function PetNeedButton({
  actionId,
  label,
  value,
  cost,
  affordable,
  full,
  busy,
  onPress,
}: PetNeedButtonProps) {
  const tone = TONES[toneFor(value)];
  const icon = careIcon(actionId);
  const critical = value <= 30;
  const blocked = full || !affordable;

  // Кругова шкала: заповнена частина кільця — це рівень потреби.
  const ring = `conic-gradient(${tone.ring} ${value * 3.6}deg, var(--color-line-strong) 0deg)`;

  const hint = full
    ? "Уже повна"
    : !affordable
      ? "Не вистачає зірочок — виконай квест"
      : `${label}: витратити ${cost} ⭐`;

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Відсоток над кнопкою */}
      <span
        className="rounded-full px-2 py-0.5 text-xs font-extrabold tabular-nums"
        style={{ background: tone.face, color: tone.text }}
      >
        {value}%
      </span>

      <button
        type="button"
        onClick={onPress}
        disabled={busy}
        title={hint}
        aria-label={`${label}. ${value} відсотків. ${hint}`}
        className={`group relative rounded-full p-[4px] transition-transform active:scale-95 disabled:cursor-not-allowed ${
          critical && !blocked ? "fq-nudge" : ""
        }`}
        style={{ background: ring }}
      >
        <span
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 sm:h-[84px] sm:w-[84px]"
          style={{
            background: tone.face,
            borderColor: "var(--color-ink)",
            // внутрішній відблиск зверху й тінь знизу — щоб кнопка мала об'єм
            boxShadow:
              "inset 0 3px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(20,14,34,0.12)",
            opacity: blocked ? 0.75 : 1,
          }}
        >
          {icon && (
            // eslint-disable-next-line @next/next/no-img-element -- піксель-арт
            <img
              src={icon.src}
              alt=""
              aria-hidden="true"
              className="fq-pixel w-[42px] sm:w-[48px]"
              draggable={false}
            />
          )}
        </span>

        {/* Замок, коли не вистачає зірочок — показник при цьому лишається читабельним */}
        {!affordable && !full && (
          <span
            className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[0.7rem]"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-ink)",
              color: "var(--color-muted)",
            }}
            aria-hidden="true"
          >
            🔒
          </span>
        )}

        {/* Знак оклику в критичному стані */}
        {critical && affordable && !full && (
          <span
            className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 text-sm font-extrabold"
            style={{
              background: "var(--color-rose-soft)",
              borderColor: "var(--color-ink)",
              color: "var(--color-rose-ink)",
            }}
            aria-hidden="true"
          >
            !
          </span>
        )}
      </button>

      <span className="text-[0.8125rem] font-bold text-[var(--color-ink-soft)]">{label}</span>

      <span className="text-[0.6875rem] font-semibold text-[var(--color-muted)] tabular-nums">
        {full ? "повна" : `${cost} ⭐`}
      </span>
    </div>
  );
}
