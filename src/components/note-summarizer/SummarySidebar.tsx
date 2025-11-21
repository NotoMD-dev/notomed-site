// src/components/note-summarizer/SummarySidebar.tsx
"use client";

import type { SectionSummary } from "@/lib/note-summarizer/types";
import { cn } from "@/lib/cn";

interface SummarySidebarProps {
  sections: SectionSummary[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}

  // Updated function to display each problem on a new line with a '#' prefix in the problem list section
export function SummarySidebar({
  sections,
  activeId,
  onChange,
}: SummarySidebarProps) {
  return (
    <aside className="rounded-3xl border border-white/70 bg-white/94 text-zinc-900 shadow-[0_28px_80px_rgba(0,0,0,0.24)] p-4 md:p-5 space-y-1">
      <p className="text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2">
        Structured summary
      </p>
      <div className="space-y-1">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <div
              key={section.id}
              className={cn(
                "w-full rounded-xl border text-xs md:text-sm transition overflow-hidden",
                isActive
                  ? "bg-pearl-200/95 border-pearl-400/80 text-zinc-900"
                  : "border-transparent hover:bg-zinc-100/80 text-zinc-700",
              )}
            >
              <button
                type="button"
                onClick={() =>
                  onChange(isActive ? null : (section.id as string))
                }
                className="w-full flex items-center justify-between px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <span className="text-[0.7rem] md:text-xs text-zinc-500">
                    {isActive ? "▾" : "▸"}
                  </span>
                  <span>{section.title}</span>
                </span>
              </button>
              {isActive && (
                <div className="px-8 pb-3 text-[0.72rem] md:text-xs text-zinc-600 leading-relaxed">
                  {section.id === "problemList" ? (
                    <ul className="space-y-1">
                      {section.content
                        ?.split(/\r?\n+/)
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line, idx) => {
                          const label = line
                            .replace(/^#\s*/, "")
                            .replace(/\s*#$/, "");
                          return (
                            <li key={idx} className="flex gap-2">
                              <span className="text-zinc-400">#</span>
                              <span>{label}</span>
                            </li>
                          );
                        })}
                    </ul>
                  ) : (
                    <p className="whitespace-pre-line">
                      {section.content || (
                        <span className="italic text-zinc-500">
                          No structured summary yet. This section will populate
                          from the note text once the model is wired.
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[0.65rem] md:text-[0.7rem] text-zinc-500">
        Abbreviation: <span className="font-semibold">HD</span> = hospital day.
      </p>
    </aside>
  );
}
