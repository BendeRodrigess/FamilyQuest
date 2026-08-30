import { NEED_LABEL, NEED_MAX, type Needs } from "@/lib/companion/state";

const ROWS = [
  { key: "fullness", emoji: "🍗", color: "#7fc9a0" },
  { key: "mood", emoji: "😊", color: "#f0c558" },
  { key: "energy", emoji: "⚡", color: "#6cb6f0" },
] as const;

/** Три шкали потреб — як на макеті: значок, смуга, значення. */
export function NeedBars({ needs }: { needs: Needs }) {
  return (
    <div className="flex flex-col gap-2.5">
      {ROWS.map((row) => {
        const value = needs[row.key];
        const pct = Math.round((value / NEED_MAX) * 100);

        return (
          <div key={row.key} className="flex items-center gap-3">
            <span className="w-6 text-center text-lg" aria-hidden="true">
              {row.emoji}
            </span>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--color-ink-soft)]">
                  {NEED_LABEL[row.key]}
                </span>
                <span className="text-xs font-bold text-[var(--color-muted)]">{pct}%</span>
              </div>

              <div
                className="h-2.5 overflow-hidden rounded-full bg-[var(--color-slate-soft)]"
                role="progressbar"
                aria-label={NEED_LABEL[row.key]}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: row.color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
