import { cn } from "./cn";

export const THEME_SHELL_CLASS = "theme-shell";

export const THEME_OVERLAYS = {
  grid: "pointer-events-none fixed inset-0 z-0 opacity-[0.32]",
  lacquer: "pointer-events-none fixed inset-0 z-0 opacity-[0.5] mix-blend-soft-light",
  gridInner: "h-full w-full theme-grid",
  lacquerInner: "h-full w-full theme-lacquer",
};

const CARD_VARIANT_CLASS: Record<"surface" | "muted" | "dashed", string> = {
  surface: "card-surface",
  muted: "card-muted",
  dashed: "card-dashed",
};

const CARD_SHADOW = "shadow-[0_22px_70px_rgba(0,0,0,0.7)]";
const CARD_HOVER = "hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(0,0,0,0.9)]";
const CARD_BASE = "group relative overflow-hidden rounded-2xl";

export const CARD_GLOW_LAYER =
  "absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100";
export const CARD_GLOW_DISC =
  "pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(214,129,88,0.4),transparent_65%)] blur-3xl";

export type CardVariant = keyof typeof CARD_VARIANT_CLASS;

export function getCardClassName({
  variant = "surface",
  interactive = true,
  padding = "p-6",
  className,
}: {
  variant?: CardVariant;
  interactive?: boolean;
  padding?: string;
  className?: string;
} = {}): string {
  return cn(
    CARD_BASE,
    CARD_VARIANT_CLASS[variant],
    CARD_SHADOW,
    padding,
    interactive && CARD_HOVER,
    className,
  );
}
