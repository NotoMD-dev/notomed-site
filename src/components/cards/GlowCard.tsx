import type { HTMLAttributes, ReactNode } from "react";

import {
  CARD_GLOW_DISC,
  CARD_GLOW_LAYER,
  type CardVariant,
  getCardClassName,
} from "@/lib/design-system";
import { cn } from "@/lib/cn";

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  interactive?: boolean;
  disableGlow?: boolean;
  contentClassName?: string;
  padding?: string;
}

export function GlowCard({
  children,
  className,
  variant = "surface",
  interactive = true,
  disableGlow = false,
  contentClassName,
  padding,
  ...rest
}: GlowCardProps) {
  return (
    <div
      className={cn(getCardClassName({ variant, interactive, padding, className }))}
      {...rest}
    >
      {!disableGlow ? (
        <div className={CARD_GLOW_LAYER} aria-hidden>
          <div className={CARD_GLOW_DISC} />
        </div>
      ) : null}
      <div className={cn("relative", contentClassName)}>{children}</div>
    </div>
  );
}
