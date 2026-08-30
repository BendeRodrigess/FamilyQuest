// Форматування дат українською. Викликається переважно на сервері,
// а результат передається у клієнтські компоненти вже рядком —
// так уникаємо розбіжності між серверним і клієнтським рендером.

const TIME = new Intl.DateTimeFormat("uk-UA", { hour: "2-digit", minute: "2-digit" });
const DAY_MONTH = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long" });
const DAY_MONTH_YEAR = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Різниця в календарних днях: 0 — сьогодні, 1 — завтра, -1 — учора. */
function dayOffset(date: Date, now: Date): number {
  return Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);
}

function sameYear(date: Date, now: Date): boolean {
  return date.getFullYear() === now.getFullYear();
}

function dateLabel(date: Date, now: Date): string {
  const offset = dayOffset(date, now);
  if (offset === 0) return "сьогодні";
  if (offset === 1) return "завтра";
  if (offset === -1) return "учора";
  return sameYear(date, now) ? DAY_MONTH.format(date) : DAY_MONTH_YEAR.format(date);
}

/** «Виконати сьогодні до 10:00», «Виконати 12 вересня до 18:00». */
export function formatDueLabel(dueAt: Date, now: Date = new Date()): string {
  return `Виконати ${dateLabel(dueAt, now)} до ${TIME.format(dueAt)}`;
}

/** Короткий варіант для щільних списків: «сьогодні, 10:00». */
export function formatShortDate(date: Date, now: Date = new Date()): string {
  return `${dateLabel(date, now)}, ${TIME.format(date)}`;
}

/** «Позначено виконаним сьогодні о 12:40». */
export function formatSubmittedLabel(date: Date, now: Date = new Date()): string {
  return `${dateLabel(date, now)} о ${TIME.format(date)}`;
}

/** Скільки лишилось до дедлайну: «3 дні», «5 год», «40 хв», «час вийшов». */
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

/** Значення для <input type="datetime-local">: локальний час без зсуву. */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
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
