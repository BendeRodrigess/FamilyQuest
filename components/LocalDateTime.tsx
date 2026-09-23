"use client";

import { formatDueLabel, formatShortDate, formatSubmittedLabel } from "@/lib/format";
import { deviceTimeZone } from "@/lib/time";
import { SLOW_TICK, useNow } from "./clock";

/**
 * Дата й час у зоні пристрою.
 *
 * Сервер малює `initial` — той самий рядок, порахований за збереженою
 * зоною користувача. Після монтування компонент перераховує його за
 * справжньою зоною браузера. У звичайному випадку зони збігаються й на
 * екрані нічого не смикається; розійтися вони можуть хіба що одразу після
 * переїзду в інший пояс — і тоді підпис виправляється миттєво, ще до того,
 * як нова зона доїде до бази.
 *
 * Живий `now` тут не заради секунд, а заради «сьогодні / завтра»: о 00:00
 * підпис має перемкнутися сам.
 */

const FORMATTERS = {
  due: formatDueLabel,
  short: formatShortDate,
  submitted: formatSubmittedLabel,
} as const;

export type DateVariant = keyof typeof FORMATTERS;

export function LocalDateTime({
  iso,
  initial,
  variant = "short",
}: {
  iso: string;
  /** Рядок, порахований на сервері за збереженою зоною. */
  initial: string;
  variant?: DateVariant;
}) {
  const now = useNow(SLOW_TICK);

  if (now === 0) return <>{initial}</>;

  return <>{FORMATTERS[variant](new Date(iso), new Date(now), deviceTimeZone())}</>;
}
