import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const HERO_VARIANTS = {
  sage: {
    surface: "#f6faf6",
    border: "rgba(118, 148, 131, 0.45)",
    title: "#173528",
    text: "#2a4033",
    muted: "#4c6154",
    eyebrow: "rgba(20, 61, 40, 0.7)",
  },
  linen: {
    surface: "#fdf9f4",
    border: "rgba(195, 172, 146, 0.55)",
    title: "#2d2a23",
    text: "#3c352b",
    muted: "#6d5f4f",
    eyebrow: "rgba(88, 71, 53, 0.75)",
  },
  petal: {
    surface: "#fbf3f7",
    border: "rgba(209, 162, 186, 0.55)",
    title: "#3a2231",
    text: "#4b2c3b",
    muted: "#7a4c66",
    eyebrow: "rgba(109, 64, 85, 0.65)",
  },
} as const;

type HeroVariant = keyof typeof HERO_VARIANTS;

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
  heroVariant?: HeroVariant;
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
  const palette = HERO_VARIANTS[heroVariant] ?? HERO_VARIANTS.sage;
  const heroStyle = {
    "--tool-hero-border": palette.border,
    "--tool-hero-surface": palette.surface,
    "--tool-hero-title": palette.title,
    "--tool-hero-text": palette.text,
    "--tool-hero-muted": palette.muted,
    "--tool-hero-eyebrow": palette.eyebrow,
  } as CSSProperties;

  return (
    <div className="tool-shell theme-shell theme-grid theme-lacquer">
      <div className={`relative z-10 px-4 pb-16 pt-6 sm:px-6 lg:px-10`}>
        <div className={`mx-auto w-full ${maxWidthClass} space-y-6`}>
          <div>
            <Link href={backHref} className="tool-back-link">
              ← {backLabel}
            </Link>
          </div>

          <section className="tool-hero" style={heroStyle}>
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
