import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const VARIANT_STYLES = {
  hero: "py-3 pr-4 text-sm shadow-[0_16px_45px_rgba(0,0,0,0.15)] sm:text-base",
  compact: "py-2.5 pr-3 text-sm shadow-[0_12px_36px_rgba(0,0,0,0.25)]",
};

type Variant = keyof typeof VARIANT_STYLES;

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children" | "id"> {
  id: string;
  label: string;
  variant?: Variant;
  hideIcon?: boolean;
  containerClassName?: string;
}

export function SearchInput({
  id,
  label,
  variant = "hero",
  hideIcon = false,
  containerClassName,
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative", containerClassName)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {!hideIcon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <Search
            className={cn(
              "h-4 w-4",
              variant === "compact" ? "h-3.5 w-3.5" : null,
            )}
            aria-hidden
          />
        </span>
      ) : null}
      <input
        id={id}
        type="search"
        className={cn(
          "input-olive w-full rounded-xl focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/70 transition-all",
          hideIcon ? "pl-3" : "pl-10",
          VARIANT_STYLES[variant],
          className,
        )}
        {...props}
      />
    </div>
  );
}
