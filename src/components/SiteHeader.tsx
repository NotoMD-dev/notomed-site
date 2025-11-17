// Restyled global header to Olive V3 theme for consistent navigation with responsive menu
"use client";

import Link from "next/link";
import React from "react";

import ThemeToggle from "./ThemeToggle";
import { PRIMARY_NAV_LINKS } from "@/config/navigation";

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full header-surface backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-6">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight text-heading"
        >
          notomed.dev
        </Link>

        <nav className="hidden items-center gap-6 text-base text-muted md:flex">
          {PRIMARY_NAV_LINKS.map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="transition-colors hover:text-heading"
            >
              {nav.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-heading transition-colors hover:border-[color:var(--accent)] md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
          >
            Menu
            <span aria-hidden>{isMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-200 ${
          isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-4 mb-3 overflow-hidden rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-muted)]/95 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <nav className="flex flex-col divide-y divide-[color:var(--card-outline)] text-base text-heading">
            {PRIMARY_NAV_LINKS.map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className="px-5 py-3 transition-colors hover:text-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                {nav.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
