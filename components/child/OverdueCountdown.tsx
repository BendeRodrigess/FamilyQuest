"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { IconClock } from "@/components/icons";

/* Один годинник на всі таймери на сторінці — так вони цокають синхронно. */
let clock = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(onTick: () => void) {
  listeners.add(onTick);

  if (!timer) {
    timer = setInterval(() => {
      clock = Date.now();
      for (const listener of listeners) listener();
    }, 1000);
  }

  // Перше значення потрібне одразу: інакше таймер з'явиться лише через секунду.
  clock = Date.now();
  onTick();

  return () => {
    listeners.delete(onTick);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function formatLeft(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Скільки лишилось до зникнення простроченого квесту.
 * Саме цей зворотний відлік створює відчуття упущеної можливості —
 * тому він видимий і цокає, а не просто написаний текстом.
 */
export function OverdueCountdown({ lostAtIso }: { lostAtIso: string }) {
  const router = useRouter();

  // На сервері годинник не запущений — там показуємо нейтральний підпис,
  // інакше серверна й клієнтська розмітка розійшлися б на секунду.
  const now = useSyncExternalStore(
    subscribe,
    () => clock,
    () => 0,
  );

  const lostAt = new Date(lostAtIso).getTime();
  const remaining = now === 0 ? null : lostAt - now;
  const expired = remaining !== null && remaining <= 0;

  // Час вийшов — просимо сервер перерахувати статуси й прибрати квест.
  useEffect(() => {
    if (expired) router.refresh();
  }, [expired, router]);

  return (
    <p className="mb-3 flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-amber-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-amber-ink)]">
      <IconClock className="h-[1.15rem] w-[1.15rem] shrink-0" />
      {remaining === null ? (
        <span>Час вийшов — квест скоро зникне.</span>
      ) : expired ? (
        <span>Час вийшов.</span>
      ) : (
        <span>
          Зникне через <span className="tabular-nums">{formatLeft(remaining)}</span>. Попроси
          батьків перенести термін, якщо ще хочеш виконати.
        </span>
      )}
    </p>
  );
}
