// src/components/note-summarizer/NoteSummarizerInput.tsx
"use client";

import { useMemo, useRef, useState } from "react";
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

type PdfPage = {
  getTextContent: () => Promise<{ items: PdfTextItem[] }>;
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
};

type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc?: string };
  getDocument: (options: { data: Uint8Array }) => { promise: Promise<PdfDocument> };
};

type MammothLib = {
  extractRawText: (args: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
};

type TesseractLib = {
  recognize: (
    image: File,
    lang: string,
    options?: { logger?: () => void },
  ) => Promise<{ data?: { text?: string } }>;
};

type PdfTextItem = { str?: string };

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib;
    mammoth?: MammothLib;
    Tesseract?: TesseractLib;
  }
}

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
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const newNote: NoteInput = {
        id,
        title: `Note ${prev.length + 1}`,
        text: "",
        kind: "unknown",
      };
      const nextNotes = [...prev, newNote];
      setActiveNoteId(id);
      return nextNotes;
    });
    setViewMode("original");
  }

  function resetForModeChange(nextMode: NoteInputMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setNotes([{ id: "note-1", title: "Note 1", text: "", kind: "admission" }]);
    setActiveNoteId("note-1");
    setRedactedById({});
    setViewMode("original");
    setShowDiff(false);
  }

  async function loadExternalScript(src: string) {
    if (typeof window === "undefined") return;
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      await new Promise((resolve, reject) => {
        if (existing.getAttribute("data-loaded") === "true") {
          resolve(null);
          return;
        }
        existing.addEventListener("load", () => resolve(null), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load script")), {
          once: true,
        });
      });
      return;
    }

    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.setAttribute("data-loaded", "true");
        resolve(null);
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  }

  async function extractTextFromFile(file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (!ext) {
      throw new Error("Unsupported file type");
    }

    if (["txt", "rtf", "md"].includes(ext)) {
      return (await file.text()).trim();
    }

    if (ext === "pdf") {
      await loadExternalScript(
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.js",
      );
      await loadExternalScript(
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.js",
      );

      const pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib) throw new Error("Unable to load PDF parser");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.js";

      const typedarray = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text +=
          content.items
            .map((item: PdfTextItem) => (item.str ? item.str : ""))
            .join(" ") + "\n";
      }
      return text.trim();
    }

    if (ext === "doc" || ext === "docx") {
      await loadExternalScript(
        "https://unpkg.com/mammoth/mammoth.browser.min.js",
      );
      const mammoth = window.mammoth;
      if (!mammoth) throw new Error("Unable to load Word parser");
      const result = await mammoth.extractRawText({
        arrayBuffer: await file.arrayBuffer(),
      });
      return (result?.value ?? "").trim();
    }

    if (["png", "jpg", "jpeg"].includes(ext)) {
      await loadExternalScript(
        "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js",
      );
      const tesseract = window.Tesseract;
      if (!tesseract) throw new Error("Unable to load image text parser");
      const { data } = await tesseract.recognize(file, "eng", {
        logger: () => {},
      });
      return (data?.text ?? "").trim();
    }

    throw new Error("Unsupported file type");
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const parsedNotes: NoteInput[] = [];
      const existing =
        mode === "upload" ? notes.filter((n) => n.text.trim().length > 0) : [];

      for (const file of Array.from(files)) {
        const extracted = await extractTextFromFile(file);
        const id = `note-${existing.length + parsedNotes.length + 1}`;
        parsedNotes.push({
          id,
          title: file.name,
          text: extracted,
          kind: "unknown",
        });
      }

      const nextNotes = [...existing, ...parsedNotes];

      const scrubbed = scrubNotesClientSide(nextNotes);
      const redactedMap = scrubbed.reduce<Record<string, string>>((acc, note) => {
        acc[note.id] = note.text;
        return acc;
      }, {});

      setNotes(nextNotes);
      setRedactedById(redactedMap);
      const latestId = nextNotes[nextNotes.length - 1]?.id ?? "note-1";
      setActiveNoteId(latestId);
      setViewMode("redacted");
      setShowDiff(true);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to read uploaded file(s). Please try again.";
      setError(msg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploading(false);
    }
  }

  function deleteNote(id: string) {
    if (notes.length === 1) return;
    setNotes((prev) => {
      const filtered = prev.filter((note) => note.id !== id);
      const nextActive =
        activeNoteId === id
          ? filtered[filtered.length - 1]?.id ?? filtered[0]?.id
          : activeNoteId;
      setActiveNoteId(nextActive ?? "note-1");
      return filtered;
    });
    setRedactedById((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
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
      setError(
        "Please add at least one de-identified note (pasted or uploaded) before continuing.",
      );
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
        {notes.map((note, idx) => (
          <div key={note.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveNoteId(note.id);
                // When switching notes, keep whatever view mode the user last chose.
              }}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
              ${
                activeNoteId === note.id
                  ? "bg-white dark:bg-zinc-900 shadow-md border-pearl-400/60 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 ring-2 ring-emerald-400/70"
                  : "bg-transparent border border-white/70 text-white/90 hover:bg-white/10"
              }`}
            >
              {note.title || `Note ${idx + 1}`}
            </button>
            {notes.length > 1 && (
              <button
                type="button"
                aria-label={`Delete ${note.title || `Note ${idx + 1}`}`}
                onClick={() => deleteNote(note.id)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white/80 hover:bg-red-500/20 hover:text-red-50 border border-white/30"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {mode === "paste" ? (
          <button
            type="button"
            onClick={addNote}
            className="px-4 py-2 rounded-xl text-xs md:text-sm border border-dashed border-white/70 bg-transparent text-white/90 hover:bg-white/10"
          >
            + Add note
          </button>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-xl text-xs md:text-sm border border-dashed border-white/70 bg-transparent text-white/90 hover:bg-white/10 disabled:opacity-60"
          >
            + Upload note
          </button>
        )}
      </div>

      {activeNote && activeNote.text.trim().length === 0 && (
        <div className="rounded-xl bg-emerald-900/30 border border-emerald-500/60 text-emerald-50 px-4 py-3 text-xs md:text-sm">
          <p className="font-semibold">
            You&apos;re on {activeNote.title}. Select a note type and {" "}
            {mode === "paste"
              ? "paste your de-identified content to begin."
              : "upload files to populate this note."}
          </p>
        </div>
      )}

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
            onClick={() => resetForModeChange("paste")}
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
            onClick={() => resetForModeChange("upload")}
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
        /* UPLOAD MODE */
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".txt,.pdf,.doc,.docx,.rtf,.md,.png,.jpg,.jpeg"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          <div className="h-64 md:h-72 rounded-2xl border border-dashed border-white/60 bg-black/20 flex flex-col items-center justify-center text-center px-6 text-white">
            <p className="font-semibold text-sm md:text-base">
              Upload a PDF, Word document, text file, or image (JPEG/PNG)
            </p>
            <p className="text-xs md:text-sm mt-2 max-w-xl text-white/80">
              Files never leave your device. Each upload is converted to text in the browser and run through the same PHI scrubber used for pasted notes.
            </p>
            <p className="text-[0.7rem] md:text-xs mt-3 text-white/70">
              You can select multiple files at once; every file becomes its own note tab above.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 rounded-xl text-xs md:text-sm border border-white/80 bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"
              >
                {uploading ? "Reading files…" : "Choose files…"}
              </button>
            </div>
          </div>

          {notes.filter((n) => n.text.trim().length > 0).length > 0 && (
            <div className="rounded-xl bg-white/10 border border-white/30 px-4 py-3 text-xs md:text-sm text-white/90">
              <p className="font-semibold mb-2">Uploaded notes</p>
              <ul className="space-y-1 list-disc list-inside text-white/80">
                {notes
                  .filter((n) => n.text.trim().length > 0)
                  .map((n) => (
                    <li key={n.id}>{n.title}</li>
                  ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[0.7rem] md:text-[0.75rem] text-white/80 max-w-xl">
              Upload-only mode is active. To switch back to pasting, use the toggle above (this will clear uploaded files).
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 rounded-xl text-xs md:text-sm border border-white/80 bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"
              >
                Add more files
              </button>
              <button
                type="button"
                onClick={handleProcess}
                disabled={loading || uploading || !notes.some((n) => n.text.trim().length > 0)}
                className="px-5 py-2 rounded-xl text-xs md:text-sm font-semibold bg-emerald-700 text-white shadow-md disabled:opacity-60"
              >
                {loading ? "Processing…" : "Process notes →"}
              </button>
            </div>
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
