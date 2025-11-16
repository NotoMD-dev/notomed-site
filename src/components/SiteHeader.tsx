// Restyled global header to Olive V3 theme for consistent navigation
import Link from "next/link";

import ThemeToggle from "./ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full header-surface backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight text-heading">
          notomed.dev
        </Link>
        <div className="flex items-center gap-5 text-sm text-muted">
          <nav className="flex items-center gap-6">
            <Link href="/tools" className="transition-colors hover:text-heading">
              Tools
            </Link>
            <Link href="/#contact" className="transition-colors hover:text-heading">
              Contact
            </Link>
            <Link href="/about" className="transition-colors hover:text-heading">
              About
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
