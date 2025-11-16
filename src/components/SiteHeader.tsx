// Restyled global header to Olive V3 theme for consistent navigation
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#444f44] bg-[#303b32]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[#f5f2eb]">
          notomed.dev
        </Link>
        <nav className="flex gap-6 text-sm text-[#cbc4b6]">
          <Link href="/#tools" className="transition-colors hover:text-[#ffffff]">
            Tools
          </Link>
          <Link href="/#contact" className="transition-colors hover:text-[#ffffff]">
            Contact
          </Link>
          <Link href="/about" className="transition-colors hover:text-[#ffffff]">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
