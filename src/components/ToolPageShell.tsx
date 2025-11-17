import type { ReactNode } from "react";

import { BackButton } from "./BackButton";

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
}: ToolPageShellProps) {
  return (
    <div className="tool-shell theme-shell theme-grid theme-lacquer">
      <div className={`relative z-10 px-4 pb-16 pt-6 sm:px-6 lg:px-10`}>
        <div className={`mx-auto w-full ${maxWidthClass} space-y-6`}>
          <BackButton href={backHref} label={backLabel} className="mb-0" />

          <section className="tool-header">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                {eyebrow ? <p className="tool-header-eyebrow">{eyebrow}</p> : null}
                <h1 className="tool-header-title">{title}</h1>
                {description ? <div className="tool-header-copy">{description}</div> : null}
              </div>

              {heroAside ? <div className="tool-header-aside">{heroAside}</div> : null}
            </div>

            {footnote ? <div className="tool-header-footnote">{footnote}</div> : null}
          </section>

          <div className={bodyClassName}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default ToolPageShell;
