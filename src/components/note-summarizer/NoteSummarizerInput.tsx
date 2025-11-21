// src/components/note-summarizer/NoteSummarizerInput.tsx
"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import type {
  NoteInput,
  SummaryResult,
  NoteKind,
} from "@/lib/note-summarizer/types";
import { scrubNotesClientSide } from "@/lib/note-summarizer/clientphi";

const NOTE_KIND_OPTIONS: { value: NoteKind; label: string }[] = [
  { value: "unknown", label: "Unspecified note type" },
  { value: "admission", label: "H&P / ADMISSION" },
  { value: "progress", label: "PROGRESS" },
  { value: "discharge", label: "DISCHARGE" },
  { value: "consult", label: "CONSULT" },
  { value: "operative", label: "OPERATIVE" },
  { value: "procedure", label: "PROCEDURE" },
  { value: "other", label: "Other" },
];

type NoteInputMode = "paste" | "upload";
type ViewMode = "original" | "redacted";

type UploadStatus =
  | { kind: "success"; message: string }
  | { kind: "warning"; message: string }
  | { kind: "error"; message: string };

interface NoteSummarizerInputProps {
  onSummaryReady: (args: {
    notes: NoteInput[];
    summary: SummaryResult;
  }) => void;
}

// Very lightweight marker-based "diff": highlight only [REDACTED_*] tokens.
function buildRedactionSegments(_original: string, redacted: string) {
  const redWords = redacted.split(/\s+/); // keep your existing word-splitting
  const segments: { type: "same" | "changed"; text: string }[] = [];
  const REDACTED_RE = /\[REDACTED_[A-Z_]+\]/;

  for (const rw of redWords) {
    if (!rw) continue;

    if (REDACTED_RE.test(rw)) {
      segments.push({ type: "changed", text: rw });
    } else {
      segments.push({ type: "same", text: rw });
    }
  }

  return segments;
}

export function NoteSummarizerInput({
  onSummaryReady,
}: NoteSummarizerInputProps) {
  const [notes, setNotes] = useState<NoteInput[]>([
    { id: "note-1", title: "Note 1", text: "", kind: "admission" },
  ]);
  const [activeNoteId, setActiveNoteId] = useState("note-1");
  const [mode, setMode] = useState<NoteInputMode>("paste");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);

  // Redaction + view state
  const [redactedById, setRedactedById] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const [showDiff, setShowDiff] = useState(false);
  const [isRedacting, setIsRedacting] = useState(false);

  // Hidden file input for future upload parsing
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function updateNoteKind(id: string, kind: NoteKind) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, kind } : n)));
  }

  const activeNote =
    notes.find((n) => n.id === activeNoteId) ?? notes[0] ?? null;

  function updateNoteText(id: string, text: string) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
    // If the user edits the original note, any previous redaction for that
    // note is now stale; drop it so they can re-run auto-redact.
    setRedactedById((prev) => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  function addNote() {
    setNotes((prev) => {
      const id = `note-${prev.length + 1}`;
      return [...prev, { id, title: `Note ${prev.length + 1}`, text: "" }];
    });
    setViewMode("original");
  }

  // Auto-redact: compute redacted versions but keep originals as the source of truth.
  async function handleAutoRedact() {
    if (!notes.some((n) => n.text.trim().length > 0)) {
      return;
    }
    setIsRedacting(true);
    try {
      const scrubbed = scrubNotesClientSide(notes);
      setRedactedById((prev) => {
        const next = { ...prev };
        for (const n of scrubbed) {
          if (n.text && n.text.trim().length > 0) {
            next[n.id] = n.text;
          }
        }
        return next;
      });
      setViewMode("redacted");
      setShowDiff(true);
    } finally {
      setIsRedacting(false);
    }
  }

  async function handleProcess() {
    setError(null);
    if (!notes.some((n) => n.text.trim().length > 0)) {
      setError("Please paste at least one de-identified note before continuing.");
      return;
    }
    setLoading(true);
    try {
      // If we have redacted text for a note, prefer that; otherwise
      // scrub on send as a final safety net.
      const withRedacted: NoteInput[] = notes.map((n) =>
        redactedById[n.id]
          ? { ...n, text: redactedById[n.id] }
          : n,
      );

      const safeNotes = scrubNotesClientSide(withRedacted);

      const resp = await fetch("/api/note-summarizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "summary",
          notes: safeNotes,
        }),
      });

      const json = (await resp.json()) as {
        sections?: SummaryResult["sections"];
        rawText?: string;
      };

      if (!Array.isArray(json.sections) || json.sections.length === 0) {
        throw new Error(
          "Could not build structured summary from notes. Please try again.",
        );
      }

      onSummaryReady({ notes: safeNotes, summary: { sections: json.sections } });
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to generate summary from notes.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const activeRedacted =
    activeNote && redactedById[activeNote.id]
      ? redactedById[activeNote.id]
      : null;

  const displayText = activeNote
    ? viewMode === "redacted" && activeRedacted
      ? activeRedacted
      : activeNote.text
    : "";

  const diffSegments = useMemo(
    () =>
      activeNote && activeRedacted
        ? buildRedactionSegments(activeNote.text, activeRedacted)
        : [],
    [activeNote, activeRedacted],
  );

  return (
    <div className="space-y-6">
      {/* PHI warning banner */}
      <div className="rounded-md border-l-4 border-amber-600 bg-amber-100/95 dark:bg-amber-900/40 dark:border-amber-500 px-4 py-3 text-sm md:text-base text-amber-950 dark:text-amber-50">
        <p className="font-semibold">⚠️ Use de-identified notes with this tool.</p>
        <p className="text-xs md:text-sm mt-1 opacity-90">
          This app will automatically execute an exhaustive auto-redaction of your
          pasted and uploaded notes; however, please do your best to remove
          obvious identifiers (name, full DOB, MRN, phone, email, street address)
          before pasting or uploading sensitive patient information. For
          information on the redaction process, please review our
          redaction/security policy below. For additional institutional questions
          and concerns please involve your compliance and legal teams. For
          further concerns, please contact me.
        </p>
        <p className="mt-2 text-[0.7rem] md:text-xs text-amber-900/90 dark:text-amber-100/90">
          <span className="opacity-80">Read more:&nbsp;</span>
          <Link
            href="/privacy"
            className="underline underline-offset-2 font-medium"
          >
            Patient Privacy &amp; PHI De-Identification Policy
          </Link>
        </p>
      </div>

      {/* Note tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => {
              setActiveNoteId(note.id);
              // When switching notes, keep whatever view mode the user last chose.
            }}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium border transition
              ${
                activeNoteId === note.id
                  ? "bg-white dark:bg-zinc-900 shadow-md border-pearl-400/60 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50"
                  : "bg-transparent border border-white/70 text-white/90 hover:bg-white/10"
              }`}
          >
            {note.title}
          </button>
        ))}
        <button
          type="button"
          onClick={addNote}
          className="px-4 py-2 rounded-xl text-xs md:text-sm border border-dashed border-white/70 bg-transparent text-white/90 hover:bg-white/10"
        >
          + Add note
        </button>
      </div>

      {/* Note type pill + mode toggle pill */}
      <div className="flex flex-wrap items-center gap-3 mt-2">
        {activeNote && (
          <div className="inline-flex items-center gap-3 rounded-full bg-white/10 border border-white/70 px-4 py-1.5 text-xs md:text-sm text-white/90">
            <span className="uppercase tracking-[0.16em] text-[0.65rem] md:text-[0.7rem] opacity-80">
              Note type
            </span>
            <div className="relative">
              <select
                value={activeNote.kind ?? "unknown"}
                onChange={(e) =>
                  updateNoteKind(activeNote.id, e.target.value as NoteKind)
                }
                className="note-type-select appearance-none bg-transparent border-none pr-6 pl-0 text-xs md:text-sm font-medium focus:outline-none cursor-pointer"
              >
                {NOTE_KIND_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[0.6rem] text-white/80">
                ▾
              </span>
            </div>
          </div>
        )}

        {/* Mode toggle */}
        <div className="inline-flex items-center rounded-full bg-white/5 p-1 text-xs md:text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("paste");
              setUploadStatus(null);
            }}
            className={`px-4 py-1.5 rounded-full font-medium transition ${
              mode === "paste"
                ? "bg-white/15 border border-white/80 text-white shadow-sm"
                : "bg-transparent border border-transparent text-white/80 hover:bg-white/5"
            }`}
          >
            Paste note
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("upload");
              setUploadStatus(null);
            }}
            className={`px-4 py-1.5 rounded-full font-medium transition ${
              mode === "upload"
                ? "bg-white/15 border border-white/80 text-white shadow-sm"
                : "bg-transparent border border-transparent text-white/80 hover:bg-white/5"
            }`}
          >
            Upload file
          </button>
        </div>

        {/* View mode + diff toggle (only if we have a redacted version for this note) */}
        {activeNote && activeRedacted && (
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-[0.7rem] md:text-xs text-white/90">
            <span className="uppercase tracking-[0.16em] text-[0.6rem] opacity-70">
              View
            </span>
            <button
              type="button"
              onClick={() => setViewMode("original")}
              className={`px-2 py-1 rounded-full border text-[0.7rem] md:text-xs transition ${
                viewMode === "original"
                  ? "bg-white/90 text-zinc-900 border-white"
                  : "bg-transparent border-white/40 text-white/80 hover:bg-white/10"
              }`}
            >
              Original (PHI)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("redacted")}
              className={`px-2 py-1 rounded-full border text-[0.7rem] md:text-xs transition ${
                viewMode === "redacted"
                  ? "bg-emerald-600 text-white border-emerald-300"
                  : "bg-transparent border-white/40 text-white/80 hover:bg-white/10"
              }`}
            >
              Redacted (safe)
            </button>
            <button
              type="button"
              onClick={() => setShowDiff((s) => !s)}
              className={`px-2 py-1 rounded-full border text-[0.7rem] md:text-xs transition ${
                showDiff
                  ? "bg-amber-500 text-amber-950 border-amber-200"
                  : "bg-transparent border-amber-300/60 text-amber-100 hover:bg-amber-500/10"
              }`}
            >
              {showDiff ? "Hide changes" : "Show redaction highlights"}
            </button>
          </div>
        )}
      </div>

      {/* PASTE MODE */}
      {mode === "paste" && activeNote ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-300/80 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/85 p-3 md:p-4">
            <textarea
              value={displayText}
              onChange={(e) => {
                if (!activeNote) return;
                if (viewMode === "redacted" && activeRedacted) {
                  // In redacted view we treat the textarea as read-only to avoid
                  // accidentally editing the safe copy; users should edit the
                  // original and re-run auto-redact instead.
                  return;
                }
                updateNoteText(activeNote.id, e.target.value);
              }}
              readOnly={viewMode === "redacted" && !!activeRedacted}
              className="note-textarea w-full h-64 md:h-72 bg-transparent outline-none resize-none font-mono text-xs md:text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
              placeholder="Paste de-identified clinical note here…"
            />
            {viewMode === "redacted" && activeRedacted && (
              <p className="mt-2 text-[0.65rem] md:text-[0.7rem] text-zinc-500">
                You&apos;re viewing the <span className="font-semibold">redacted</span>{" "}
                copy. To make edits, switch back to{" "}
                <span className="font-semibold">Original (PHI)</span> and re-run
                auto-redact.
              </p>
            )}
          </div>

          {/* Optional diff viewer */}
          {showDiff && activeNote && activeRedacted && diffSegments.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white/95 dark:bg-zinc-950/85 dark:border-zinc-700/80 p-3 md:p-4 shadow-sm space-y-2">
              {/* Header + legend */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[0.68rem] md:text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Redaction highlights
                  </p>
                  <p className="text-[0.68rem] md:text-[0.72rem] text-zinc-500 max-w-2xl">
                    Highlighted text shows where the redacted copy differs from your
                    original pasted note. This is a heuristic view to help spot possible
                    PHI removals.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100/90 dark:bg-zinc-900/80 px-3 py-1 text-[0.65rem] md:text-[0.7rem] text-zinc-700 dark:text-zinc-200">
                  <span className="inline-flex h-3 w-3 rounded-[4px] bg-amber-300/90 dark:bg-amber-500/90" />
                  <span>Changed from original</span>
                </div>
              </div>

              {/* Scrollable diff body */}
              <div className="max-h-56 md:max-h-64 overflow-auto rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 px-3 py-2">
                <div className="whitespace-pre-wrap font-mono text-[0.7rem] md:text-[0.75rem] leading-relaxed text-zinc-800 dark:text-zinc-100">
                  {diffSegments.map((seg, idx) =>
                    seg.type === "same" ? (
                      <span key={idx}>{seg.text + " "}</span>
                    ) : (
                      <span
                        key={idx}
                        className="bg-amber-300/90 dark:bg-amber-500/90 text-zinc-900 dark:text-zinc-950 rounded-[3px] px-0.5"
                      >
                        {seg.text + " "}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAutoRedact}
                disabled={isRedacting || !notes.some((n) => n.text.trim().length > 0)}
                className="px-4 py-2 rounded-xl text-xs md:text-sm border border-zinc-300 dark:border-zinc-600 bg-white/90 dark:bg-zinc-900/85 text-zinc-900 dark:text-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {isRedacting ? "Auto-redacting…" : "Preview Redacted PHI"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!activeNote) return;
                  updateNoteText(activeNote.id, "");
                }}
                className="px-4 py-2 rounded-xl text-xs md:text-sm border border-transparent bg-transparent hover:bg-white/10 text-white/90"
              >
                Clear
              </button>
            </div>
            <button
              type="button"
              onClick={handleProcess}
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs md:text-sm font-semibold bg-emerald-700 text-white shadow-md disabled:opacity-60"
            >
              {loading ? "Processing…" : "Process notes →"}
            </button>
          </div>
        </div>
      ) : (
        /* UPLOAD MODE (visual stub for now) */
        <div className="space-y-4">
          {/* hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.pdf,.doc,.docx,.rtf,.md,.png,.jpg,.jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";

              if (!file) return;

              const isTextLike =
                file.type.startsWith("text/") || /\.(md|rtf|txt)$/i.test(file.name);

              if (isTextLike) {
                const reader = new FileReader();
                reader.onload = () => {
                  const content = typeof reader.result === "string" ? reader.result : "";

                  const newId = `upload-${Date.now()}`;
                  setNotes((prev) => [
                    ...prev,
                    {
                      id: newId,
                      title: file.name,
                      text: content,
                      kind: "unknown",
                    },
                  ]);
                  setMode("paste");
                  setUploadStatus({
                    kind: "success",
                    message:
                      "Loaded text from the uploaded file. Review and redact it above before processing.",
                  });
                  setActiveNoteId(newId);
                };
                reader.onerror = () => {
                  setUploadStatus({
                    kind: "error",
                    message: "Could not read that file. Please try again or paste the text instead.",
                  });
                };
                reader.readAsText(file);
              } else {
                setUploadStatus({
                  kind: "warning",
                  message:
                    "This file type is not yet supported for automatic import. Please copy/paste the text into the editor.",
                });
              }
            }}
          />
          <div className="h-64 md:h-72 rounded-2xl border border-dashed border-white/60 bg-black/20 flex flex-col items-center justify-center text-center px-6 text-white">
            <p className="font-semibold text-sm md:text-base">
              Upload a PDF, Word document, or image
            </p>
            <p className="text-xs md:text-sm mt-2 max-w-md text-white/80">
              In a future version, files will be parsed locally with PHI removed
              before any analysis. For now, after upload, please paste
              de-identified text into the editor above to use the tool.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 rounded-xl text-xs md:text-sm border border-white/80 bg-white/10 text-white hover:bg-white/20"
            >
              Choose file…
            </button>
          </div>

          {uploadStatus && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm md:text-base ${
                uploadStatus.kind === "success"
                  ? "border-emerald-300/70 bg-emerald-900/30 text-emerald-50"
                  : uploadStatus.kind === "warning"
                    ? "border-amber-300/70 bg-amber-900/30 text-amber-50"
                    : "border-red-300/70 bg-red-900/30 text-red-50"
              }`}
            >
              {uploadStatus.message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleProcess}
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs md:text-sm font-semibold bg-emerald-700 text-white shadow-md disabled:opacity-60"
            >
              {loading ? "Processing…" : "Process notes →"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-100 bg-red-900/70 border border-red-500/80 p-3 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
}
