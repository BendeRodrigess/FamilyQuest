// Форматування дат українською.
//
// Зона завжди передається параметром. Раніше ці функції покладалися на
// `Intl.DateTimeFormat` без `timeZone`, тобто на зону процесу — і на сервері
// показували час в UTC. Тепер зона приходить явно: у браузері це зона
// пристрою, на сервері — збережена зона користувача.
//
// Функції лишаються чистими, тому один і той самий виклик на сервері й
// у браузері дає однаковий рядок. Саме на цьому тримається `LocalDateTime`.

import { dayOffsetIn, wallClockIn } from "./time";

const timeFormatters = new Map<string, Intl.DateTimeFormat>();
const dayMonthFormatters = new Map<string, Intl.DateTimeFormat>();
const dayMonthYearFormatters = new Map<string, Intl.DateTimeFormat>();

function cached(
  store: Map<string, Intl.DateTimeFormat>,
  zone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  let formatter = store.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("uk-UA", { ...options, timeZone: zone });
    store.set(zone, formatter);
  }
  return formatter;
}

const time = (zone: string) =>
  cached(timeFormatters, zone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const dayMonth = (zone: string) =>
  cached(dayMonthFormatters, zone, { day: "numeric", month: "long" });

const dayMonthYear = (zone: string) =>
  cached(dayMonthYearFormatters, zone, { day: "numeric", month: "long", year: "numeric" });

function dateLabel(date: Date, now: Date, zone: string): string {
  const offset = dayOffsetIn(date, now, zone);
  if (offset === 0) return "сьогодні";
  if (offset === 1) return "завтра";
  if (offset === -1) return "учора";

  const sameYear = wallClockIn(date, zone).year === wallClockIn(now, zone).year;
  return sameYear ? dayMonth(zone).format(date) : dayMonthYear(zone).format(date);
}

/** «Виконати сьогодні до 10:00», «Виконати 12 вересня до 18:00». */
export function formatDueLabel(dueAt: Date, now: Date, zone: string): string {
  return `Виконати ${dateLabel(dueAt, now, zone)} до ${time(zone).format(dueAt)}`;
}

/** Короткий варіант для щільних списків: «сьогодні, 10:00». */
export function formatShortDate(date: Date, now: Date, zone: string): string {
  return `${dateLabel(date, now, zone)}, ${time(zone).format(date)}`;
}

/** «Позначено виконаним сьогодні о 12:40». */
export function formatSubmittedLabel(date: Date, now: Date, zone: string): string {
  return `${dateLabel(date, now, zone)} о ${time(zone).format(date)}`;
}

/**
 * Готова фраза для картки квесту: «лишилось 2 год» або «час вийшов».
 *
 * Окремо від `formatTimeLeft`, бо «лишилось час вийшов» звучало б безглуздо,
 * а дійти до цього стану картка тепер може: таймер живий і перетинає
 * дедлайн просто на очах.
 */
export function formatTimeLeftPhrase(dueAt: Date, now: Date = new Date()): string {
  if (dueAt.getTime() <= now.getTime()) return "час вийшов";
  return `лишилось ${formatTimeLeft(dueAt, now)}`;
}

/**
 * Скільки лишилось до дедлайну: «3 дні», «5 год», «40 хв», «час вийшов».
 *
 * Зона тут не потрібна взагалі: це різниця двох абсолютних моментів.
 * Важливо лише, щоб `now` був справжнім «зараз» того, хто дивиться —
 * тому в браузері значення перераховується живцем.
 */
export function formatTimeLeft(dueAt: Date, now: Date = new Date()): string {
  const ms = dueAt.getTime() - now.getTime();
  if (ms <= 0) return "час вийшов";

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes} хв`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} год`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "1 день";
  if (days < 5) return `${days} дні`;
  return `${days} днів`;
}

/**
 * Значення для `<input type="datetime-local">`: настінний час у зоні `zone`.
 * Сам елемент зсуву не приймає — саме тому конвертацію робимо тут.
 */
export function toDateTimeLocalValue(date: Date, zone: string): string {
  const wall = wallClockIn(date, zone);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    `${wall.year}-${pad(wall.month)}-${pad(wall.day)}` +
    `T${pad(wall.hour)}:${pad(wall.minute)}`
  );
}

/** Правильна форма слова «коін» для числа. */
export function coinsWord(amount: number): string {
  const abs = Math.abs(amount);
  const last = abs % 10;
  const lastTwo = abs % 100;

  if (lastTwo >= 11 && lastTwo <= 14) return "коінів";
  if (last === 1) return "коін";
  if (last >= 2 && last <= 4) return "коіни";
  return "коінів";
}

/** «5 коінів», «1 коін», «22 коіни». */
export function formatCoins(amount: number): string {
  return `${amount} ${coinsWord(amount)}`;
}

/**
 * Кличний відмінок імені для звертання: «Єва» → «Єво», «Данило» → «Даниле».
 * Покриває поширені випадки; для всього незвичного повертає ім'я без змін —
 * краще звичайне «Привіт, Alex!», ніж покручене.
 */
export function vocative(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 3) return trimmed;

  const lower = trimmed.toLowerCase();
  const last = lower.at(-1)!;
  const beforeLast = lower.at(-2)!;
  const stem = trimmed.slice(0, -1);

  const vowels = "аеєиіїоуюя";
  const cyrillic = /^[а-яґєіїь']+$/i;

  if (!cyrillic.test(lower)) return trimmed;

  if (last === "а") return `${stem}о`;
  if (last === "я") return vowels.includes(beforeLast) ? `${stem}є` : `${stem}е`;
  if (last === "о") return `${stem}е`;
  if (last === "й") return `${stem}ю`;
  if (last === "р" || last === "л" || last === "н") return `${trimmed}е`;
  if (!vowels.includes(last)) return `${trimmed}е`;

  return trimmed;
}
