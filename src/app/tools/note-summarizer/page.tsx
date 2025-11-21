// src/app/tools/note-summarizer/page.tsx
"use client";

import { useState } from "react";

import ToolPageShell from "@/components/ToolPageShell";
import type {
  NoteInput,
  SummaryResult,
} from "@/lib/note-summarizer/types";
import { NoteSummarizerInput } from "@/components/note-summarizer/NoteSummarizerInput";
import { NoteSummarizerWorkspace } from "@/components/note-summarizer/NoteSummarizerWorkspace";

type Stage = "input" | "workspace";

export default function NoteSummarizerPage() {
  const [stage, setStage] = useState<Stage>("input");
  const [notes, setNotes] = useState<NoteInput[] | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);

  function handleSummaryReady(args: {
    notes: NoteInput[];
    summary: SummaryResult;
  }) {
    setNotes(args.notes);
    setSummary(args.summary);
    setStage("workspace");
  }

  function handleBackToInput() {
    // Go back to the paste/upload step but keep the stored notes/summary
    // (NoteSummarizerInput manages its own internal state)
    setStage("input");
  }

  function handleReset() {
    // Hard reset from the workspace: clear stored notes + summary, then go back
    setNotes(null);
    setSummary(null);
    setStage("input");
  }

  const shouldShowInput = stage === "input" || !notes || !summary;

  return (
    <ToolPageShell
      title="Note Summarizer"
      eyebrow="AI-assisted reader for de-identified notes"
      description={
        <>
          Paste one or more de-identified inpatient notes, then browse a structured
          summary and ask grounded questions. Designed to support rounding and handoffs
          while keeping identifiers out of the workflow.
        </>
      }
      footnote={
        <>
          This tool is for documentation support only and does not replace clinical
          expertise or review. Please make sure to verify all output against the original notes.
        </>
      }
      backHref="/tools"
      backLabel="Back to tools"
    >
      {shouldShowInput ? (
        <NoteSummarizerInput onSummaryReady={handleSummaryReady} />
      ) : (
        <NoteSummarizerWorkspace
          notes={notes}
          summary={summary}
          onBackToInput={handleBackToInput}
          onReset={handleReset}
        />
      )}
    </ToolPageShell>
  );
}
