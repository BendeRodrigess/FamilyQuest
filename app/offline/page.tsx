export const metadata = { title: "Немає зв'язку — FamilyQuest" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--color-brand-soft)] text-[var(--color-brand-ink)]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path d="M3 3l18 18" />
          <path d="M8.5 16.5a5 5 0 0 1 7 0" />
          <path d="M5 13a10 10 0 0 1 4-2.4" />
          <path d="M15 10.6A10 10 0 0 1 19 13" />
          <path d="M2 9a15 15 0 0 1 5-3" />
          <path d="M17 6a15 15 0 0 1 5 3" />
          <path d="M12 20h.01" />
        </svg>
      </span>

      <h1 className="text-xl font-extrabold">Немає зв&apos;язку</h1>
      <p className="mt-2 max-w-xs text-[var(--color-muted)]">
        FamilyQuest показує живі дані — завдання, XP і коіни. Щойно інтернет повернеться,
        онови сторінку.
      </p>
    </div>
  );
}
