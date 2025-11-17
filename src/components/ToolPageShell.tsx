import Link from "next/link";
import type { ReactNode } from "react";

interface ToolPageShellProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  footnote?: ReactNode;
  heroAside?: ReactNode;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  maxWidthClass?: string;
  bodyClassName?: string;
  heroVariant?: "sage" | "canvas" | "mulberry";
}

export function ToolPageShell({
  title,
  eyebrow,
  description,
  footnote,
  heroAside,
  children,
  backHref = "/tools",
  backLabel = "Back to Tools",
  maxWidthClass = "max-w-6xl",
  bodyClassName = "",
  heroVariant = "sage",
}: ToolPageShellProps) {
  const heroClassName = [
    "tool-hero",
    heroVariant ? `tool-hero--${heroVariant}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="tool-shell theme-shell theme-grid theme-lacquer">
      <div className={`relative z-10 px-4 pb-16 pt-6 sm:px-6 lg:px-10`}>
        <div className={`mx-auto w-full ${maxWidthClass} space-y-6`}>
          <div>
            <Link href={backHref} className="tool-back-link">
              ← {backLabel}
            </Link>
          </div>

          <section className={heroClassName}>
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                {eyebrow ? <p className="tool-hero-eyebrow">{eyebrow}</p> : null}
                <h1 className="tool-hero-title">{title}</h1>
                {description ? <div className="tool-hero-copy">{description}</div> : null}
              </div>

              {heroAside ? <div className="tool-hero-aside">{heroAside}</div> : null}
            </div>

            {footnote ? <div className="tool-hero-footnote">{footnote}</div> : null}
          </section>

          <div className={bodyClassName}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default ToolPageShell;
