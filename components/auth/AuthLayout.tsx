import Link from "next/link";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px]">
        <Link href="/" className="mb-7 flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[var(--color-brand)] text-white">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
              <path d="M12 3.2 14.1 8l5.2.5-3.9 3.4 1.2 5.1L12 14.3 7.4 17l1.2-5.1L4.7 8.5 9.9 8Z" />
            </svg>
          </span>
          <span className="text-xl font-extrabold tracking-tight">FamilyQuest</span>
        </Link>

        <div className="fq-card p-6 sm:p-7">
          <h1 className="text-[1.375rem] font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-[var(--color-muted)]">{subtitle}</p>
          {children}
        </div>

        <div className="mt-5 text-center text-sm text-[var(--color-muted)]">{footer}</div>
      </div>
    </div>
  );
}
