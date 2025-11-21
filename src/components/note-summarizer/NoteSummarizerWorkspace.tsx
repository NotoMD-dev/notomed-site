// src/components/note-summarizer/NoteSummarizerWorkspace.tsx
"use client";

import { useState } from "react";
import type {
  NoteInput,
  SummaryResult,
} from "@/lib/note-summarizer/types";
import { SummarySidebar } from "./SummarySidebar";
import { ChatPanel } from "./ChatPanel";
import { CitationBar } from "./CitationBar";

interface NoteSummarizerWorkspaceProps {
  notes: NoteInput[];
  summary: SummaryResult;
  onBackToInput: () => void;
  onReset: () => void;
}

export function NoteSummarizerWorkspace({
  notes,
  summary,
  onBackToInput,
  onReset,
}: NoteSummarizerWorkspaceProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    summary.sections[0]?.id ?? null,
  );
  const [citations, setCitations] = useState<string[] | null>(null);
  const [snippet, setSnippet] = useState<string | null>(null); // ⭐ NEW

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
            Note summarization workspace
          </h2>
          <p className="text-xs md:text-sm text-white/80">
            Notes loaded (auto-redacted). Browse the structured summary or ask a
            focused question.
          </p>
          <p className="text-[0.7rem] md:text-xs text-white/70">
            This tool does not provide medical advice. Always verify against the
            original clinical note in your EHR.
          </p>
        </div>

        <div className="flex gap-2 mt-1 md:mt-0">
          <button
            type="button"
            onClick={onBackToInput}
            className="px-3 py-2 rounded-xl text-xs md:text-sm font-medium border border-white/70 text-white bg-white/10 hover:bg-white/20"
          >
            Back to note input
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 rounded-xl text-xs md:text-sm font-medium border border-red-200/80 text-red-50 bg-red-900/40 hover:bg-red-900/60"
          >
            Reset &amp; clear notes
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6">
        <SummarySidebar
          sections={summary.sections}
          activeId={activeSectionId}
          onChange={setActiveSectionId}
        />
        <ChatPanel
          notes={notes}
          onCitationsChange={setCitations}
          onSnippetChange={setSnippet}   // ⭐ NEW
        />
      </div>

      <CitationBar latestCitations={citations} latestSnippet={snippet} />
    </div>
  );
}
