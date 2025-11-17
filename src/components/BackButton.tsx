"use client";

import Link from "next/link";

interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function BackButton({
  href,
  label = "Back to NotoMed.dev",
  className = "",
}: BackButtonProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[color:var(--pill-bg)]/80 px-4 py-2 text-[12.375px] font-semibold uppercase tracking-[0.18em] text-heading transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
      >
        <span aria-hidden="true">←</span> {label}
      </Link>
    </div>
  );
}
