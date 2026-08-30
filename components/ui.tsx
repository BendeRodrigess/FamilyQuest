import type { ReactNode } from "react";

import type { TaskStatus } from "@/lib/domain";
import { TASK_STATUS_LABEL, TASK_STATUS_TONE } from "@/lib/domain";

/* ---------- Аватар ---------- */

const AVATAR_STYLES: Record<string, { bg: string; fg: string }> = {
  violet: { bg: "#ede7fe", fg: "#5231d6" },
  mint: { bg: "#dcf1e6", fg: "#1f7a55" },
  amber: { bg: "#fbe8cd", fg: "#97591f" },
  rose: { bg: "#fbe0e5", fg: "#a83a5c" },
  sky: { bg: "#dceafa", fg: "#245c94" },
  lime: { bg: "#e6f2d4", fg: "#4d7220" },
};

const AVATAR_SIZES = {
  sm: "h-8 w-8 text-[0.8125rem]",
  md: "h-10 w-10 text-[0.9375rem]",
  lg: "h-12 w-12 text-lg",
};

export function Avatar({
  name,
  color = "violet",
  size = "md",
}: {
  name: string;
  color?: string;
  size?: keyof typeof AVATAR_SIZES;
}) {
  const style = AVATAR_STYLES[color] ?? AVATAR_STYLES.violet;
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${AVATAR_SIZES[size]}`}
      style={{ background: style.bg, color: style.fg }}
    >
      {initial}
    </span>
  );
}

/* ---------- Плашки ---------- */

export function Pill({
  tone = "grey",
  children,
}: {
  tone?: "lilac" | "amber" | "green" | "mint" | "rose" | "sky" | "grey";
  children: ReactNode;
}) {
  return <span className={`fq-pill fq-pill-${tone}`}>{children}</span>;
}

export function StatusPill({ status }: { status: TaskStatus }) {
  return <Pill tone={TASK_STATUS_TONE[status]}>{TASK_STATUS_LABEL[status]}</Pill>;
}

/** Плашки винагороди: XP завжди, коіни — лише якщо вони є. */
export function RewardPills({ xp, coins }: { xp: number; coins: number }) {
  return (
    <>
      <Pill tone="lilac">+{xp} XP</Pill>
      {coins > 0 && <Pill tone="mint">+{coins} коінів</Pill>}
    </>
  );
}

/* ---------- Смуга прогресу ---------- */

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="fq-progress">
      <div className="fq-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------- Показник у картці ---------- */

export function StatCard({
  icon,
  tone = "lilac",
  label,
  value,
}: {
  icon: ReactNode;
  tone?: "lilac" | "mint" | "amber" | "sky" | "rose";
  label: string;
  value: ReactNode;
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    lilac: { bg: "#efeafe", fg: "#5231d6" },
    mint: { bg: "#e2f3ea", fg: "#1f7a55" },
    amber: { bg: "#fceace", fg: "#97591f" },
    sky: { bg: "#e2eefb", fg: "#245c94" },
    rose: { bg: "#fde6e6", fg: "#a83a3a" },
  };
  const t = tones[tone] ?? tones.lilac;

  // На вузьких екранах три картки стоять в ряд, тому там компонуємо їх
  // вертикально — інакше довгі підписи й великі числа не вміщаються.
  return (
    <div className="fq-card flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
      <span
        className="fq-icon-tile !h-9 !w-9 sm:!h-10 sm:!w-10"
        style={{ background: t.bg, color: t.fg }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs leading-tight text-[var(--color-muted)] sm:text-[0.8125rem]">
          {label}
        </p>
        <p className="text-lg font-extrabold text-[var(--color-ink)] sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

/* ---------- Секція зі списком ---------- */

export function SectionCard({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`fq-card p-5 ${className}`}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-[var(--color-ink)]">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

/* ---------- Порожній стан ---------- */

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-inner)] border border-dashed border-[var(--color-line-strong)] px-4 py-9 text-center">
      {icon && <span className="text-[var(--color-muted)]">{icon}</span>}
      <p className="font-semibold text-[var(--color-ink-soft)]">{title}</p>
      {hint && <p className="max-w-xs text-sm text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}

/* ---------- Повідомлення про помилку у формі ---------- */

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-[var(--radius-control)] bg-[var(--color-rose-soft)] px-3 py-2 text-sm font-medium text-[var(--color-rose-ink)]">
      {message}
    </p>
  );
}
