// Робота з часовими поясами.
//
// Єдине місце, де настінний час («23 вересня, 20:00») перетворюється на
// абсолютний момент і навпаки. Зона тут завжди передається явно.
//
// Головне правило застосунку: неявна зона рантайму не використовується
// ніде. `new Date("2026-09-23T20:00")`, `setHours`, `getHours` та
// `Intl.DateTimeFormat` без `timeZone` беруть зону процесу — на сервері це
// UTC, у браузері зона пристрою. Саме через це «20:00» перетворювалося на
// 20:00 UTC замість 20:00 за Києвом.
//
// Без зовнішніх бібліотек: усе потрібне вміє Intl.

/** Настінний час у конкретній зоні — те, що людина бачить на годиннику. */
export type WallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

// Intl.DateTimeFormat коштує дорого, а зон у застосунку одиниці.
const formatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(zone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(zone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      // h23 замість hour12:false — інакше опівночі трапляється «24».
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(zone, formatter);
  }

  return formatter;
}

/** Що показує годинник у зоні `zone` у момент `date`. */
export function wallClockIn(date: Date, zone: string): WallClock {
  const parts = partsFormatter(zone).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

/**
 * Зсув зони в мілісекундах на конкретний момент.
 * Саме «на момент», а не на зону загалом: улітку й узимку він різний.
 */
function offsetAt(ts: number, zone: string): number {
  const wall = wallClockIn(new Date(ts), zone);
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);

  // Настінний час не має мілісекунд — відкидаємо їх і в моменті,
  // інакше зсув вийшов би з «хвостом».
  return asUtc - Math.floor(ts / 1000) * 1000;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Календарний день у зоні: «2026-09-23». Ключ доби для всієї логіки. */
export function dayKeyIn(date: Date, zone: string): string {
  const wall = wallClockIn(date, zone);
  return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}`;
}

/** Ключ доби → північ цього дня в UTC. Тільки для арифметики над днями. */
function dayKeyToUtc(day: string): number {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date);
}

/** Сусідній день: «2026-09-23» + (-1) → «2026-09-22». */
export function shiftDayKey(day: string, days: number): string {
  const moved = new Date(dayKeyToUtc(day) + days * 86_400_000);
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`;
}

/** Різниця в календарних днях зони: 0 — сьогодні, 1 — завтра, -1 — учора. */
export function dayOffsetIn(date: Date, now: Date, zone: string): number {
  const a = dayKeyToUtc(dayKeyIn(date, zone));
  const b = dayKeyToUtc(dayKeyIn(now, zone));
  return Math.round((a - b) / 86_400_000);
}

/** День тижня у форматі Date.getDay(): 0 — неділя. Рахується за зоною. */
export function weekdayIn(date: Date, zone: string): number {
  return new Date(dayKeyToUtc(dayKeyIn(date, zone))).getUTCDay();
}

/**
 * «23 вересня о 20:00 у зоні X» → абсолютний момент.
 *
 * Два проходи по зсуву потрібні через переведення годинника:
 *
 * — восени година повторюється (Київ, 25.10.2026, 03:30 буває двічі) —
 *   беремо друге входження, уже за зимовим часом;
 * — навесні години не існує взагалі (Київ, 29.03.2026, 03:00 → 04:00) —
 *   такий час зсувається вперед на пропущену годину: 03:30 стає 04:30.
 *
 * Обидва випадки трапляються раз на пів року й лише для повторюваних
 * завдань; головне — що результат передбачуваний, а не «плаваючий».
 */
export function wallClockToInstant(day: string, time: string, zone: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  const target = Date.UTC(year, month - 1, date, hours || 0, minutes || 0, 0, 0);

  const ts = target - offsetAt(target, zone);
  const corrected = target - offsetAt(ts, zone);

  return new Date(corrected);
}

/**
 * Чи існує така зона. Значення приходить із браузера, тому в базу
 * потрапляє лише те, що розуміє сам Intl.
 */
export function isValidTimeZone(zone: string): boolean {
  if (!zone) return false;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Зона пристрою. Викликається лише в браузері. */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
