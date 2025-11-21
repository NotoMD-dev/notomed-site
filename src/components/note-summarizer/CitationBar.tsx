// src/components/note-summarizer/CitationBar.tsx
"use client";

import { useState } from "react";

interface CitationBarProps {
  latestCitations: string[] | null;
  latestSnippet: string | null;
}

export function CitationBar({ latestCitations, latestSnippet }: CitationBarProps) {
  const [showSnippet, setShowSnippet] = useState(false);

  const hasSnippet = !!latestSnippet && latestSnippet.trim().length > 0;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-pearl-100/70 dark:bg-zinc-900/80 px-4 py-3 text-[0.7rem] md:text-xs">
        <div>
          <span className="mr-1 font-semibold">Citation preview:</span>
          <span className="opacity-80">
            {latestCitations && latestCitations.length > 0
              ? latestCitations.join(" · ")
              : "Answers should be traceable to specific parts of the note."}
          </span>
        </div>
        <button
          type="button"
          disabled={!hasSnippet}
          onClick={() => hasSnippet && setShowSnippet((s) => !s)}
          className={`text-[0.7rem] underline underline-offset-2 ${
            hasSnippet
              ? "opacity-80 hover:opacity-100"
              : "opacity-40 cursor-not-allowed"
          }`}
        >
          View source snippet
        </button>
      </div>

      {showSnippet && hasSnippet && (
        <div className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/90 px-4 py-3 text-[0.7rem] md:text-xs font-mono whitespace-pre-wrap text-zinc-800 dark:text-zinc-100 shadow-sm">
          <span>{latestSnippet}</span>
          {latestCitations && latestCitations.length > 0 && (
            <span className="ml-1 text-[0.65rem] md:text-[0.7rem] text-zinc-500">
              [{latestCitations.join(", ")}]
            </span>
          )}
        </div>
      )}
    </div>
  );
}
