// src/components/note-summarizer/NoteSourceChips.tsx
"use client";

import { cn } from "@/lib/cn";

export type NoteSource = {
  id: string;
  label: string;
};

interface NoteSourceChipsProps {
  sources: NoteSource[];
  activeSourceId: string;
  onChange: (id: string) => void;
}

export function NoteSourceChips({
  sources,
  activeSourceId,
  onChange,
}: NoteSourceChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[0.7rem] md:text-xs">
      {sources.map((source) => {
        const isActive = activeSourceId === source.id;
        return (
          <button
            key={source.id}
            type="button"
            onClick={() => onChange(source.id)}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1.5 text-xs md:text-[0.75rem] font-medium transition-colors",
              isActive
                ? "bg-white/90 text-zinc-900 border-pearl-400/80 shadow-sm dark:bg-zinc-900/85 dark:text-zinc-50 dark:border-zinc-700"
                : "bg-white/60 text-zinc-700 border-pearl-200/80 hover:bg-white/90 hover:text-zinc-900 dark:bg-zinc-900/40 dark:text-zinc-300 dark:border-zinc-700/80 dark:hover:bg-zinc-900/70",
            )}
          >
            {source.label}
          </button>
        );
      })}
    </div>
  );
}
