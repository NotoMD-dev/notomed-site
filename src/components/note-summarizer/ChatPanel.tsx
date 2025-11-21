// src/components/note-summarizer/ChatPanel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import type { NoteInput, NoteKind } from "@/lib/note-summarizer/types";
import { NoteSourceChips, type NoteSource } from "./NoteSourceChips";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: string[];
}

interface ChatPanelProps {
  notes: NoteInput[];
  onCitationsChange: (cites: string[]) => void;
  onSnippetChange: (snippet: string | null) => void;
}

function getNoteKindLabel(kind: NoteKind | undefined): string {
  switch (kind) {
    case "admission":
      return "H&P / ADMISSION";
    case "progress":
      return "PROGRESS note";
    case "discharge":
      return "DISCHARGE summary";
    case "consult":
      return "CONSULT note";
    case "operative":
      return "OPERATIVE note";
    case "procedure":
      return "PROCEDURE note";
    case "other":
      return "Other note";
    case "unknown":
    default:
      return "";
  }
}

// Short labels for use in sources / citation chips
function getShortNoteKindLabel(kind: NoteKind | undefined): string {
  switch (kind) {
    case "admission":
      return "H&P";
    case "progress":
      return "Progress";
    case "discharge":
      return "DC summ";
    case "consult":
      return "Consult";
    case "operative":
      return "Operative";
    case "procedure":
      return "Procedure";
    case "other":
      return "Other";
    default:
      return "Note";
  }
}

// Map backend `citations` (now treated as source_ids) → human-friendly labels
function mapCitationsToLabels(rawCites: string[], notes: NoteInput[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  // 1) Assume they are note IDs first and try to map directly.
  for (const c of rawCites) {
    const note = notes.find((n) => n.id === c);
    if (!note) continue;

    const label =
      getShortNoteKindLabel(note.kind as NoteKind | undefined) ||
      note.title ||
      "Note";

    if (!seen.has(label)) {
      seen.add(label);
      labels.push(label);
    }
  }

  if (labels.length > 0) {
    return labels;
  }

  // 2) If none of them match known note IDs, treat them as already-human labels.
  for (const c of rawCites) {
    if (!seen.has(c)) {
      seen.add(c);
      labels.push(c);
    }
  }

  // 3) If still nothing (e.g. empty array), fall back to "all notes" as a generic hint.
  if (labels.length === 0 && notes.length > 0) {
    for (const note of notes) {
      if (!note.text || !note.text.trim()) continue;
      const label =
        getShortNoteKindLabel(note.kind as NoteKind | undefined) ||
        note.title ||
        "Note";
      if (!seen.has(label)) {
        seen.add(label);
        labels.push(label);
      }
    }
  }

  return labels;
}

export function ChatPanel({
  notes,
  onCitationsChange,
  onSnippetChange,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [activeSourceId, setActiveSourceId] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Ref for the auto-growing question box
  const questionInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = questionInputRef.current;
    if (!el) return;

    // Reset height so scrollHeight is measured correctly
    el.style.height = "0px";

    const next = el.scrollHeight;
    const max = 140; // cap height (~5–6 lines)
    el.style.height = `${Math.min(next, max)}px`;
  }, [question]);

  const sources: NoteSource[] = [
    { id: "all", label: "All notes" },
    ...notes.map((n, idx) => {
      const kindLabel = getNoteKindLabel(n.kind as NoteKind | undefined);
      const fallbackTitle = n.title || `Note ${idx + 1}`;
      return {
        id: n.id,
        label: kindLabel || fallbackTitle,
      };
    }),
  ];

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed) return;

    setLoading(true);
    const id = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: id + "-q", role: "user", text: trimmed },
    ]);

    const recentTurns = messages.slice(-4).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    try {
      const resp = await fetch("/api/note-summarizer/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          question: trimmed,
          activeSourceId,
          history: recentTurns,
        }),
      });

      const json = (await resp.json()) as {
        answer?: string;
        citations?: string[];
        snippet?: string | null;
      };

      const answerText =
        typeof json.answer === "string"
          ? json.answer
          : "Unable to generate answer from notes.";

      const rawCites =
        Array.isArray(json.citations) && json.citations.length > 0
          ? json.citations
          : [];

      const snippet =
        typeof json.snippet === "string" && json.snippet.trim().length > 0
          ? json.snippet.trim()
          : null;

      const cites = mapCitationsToLabels(rawCites, notes);

      // ---- Update UI ----
      setMessages((prev) => [
        ...prev,
        {
          id: id + "-a",
          role: "assistant",
          text: answerText,
          citations: cites,
        },
      ]);

      onCitationsChange(cites);
      onSnippetChange(snippet);

      setQuestion("");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: id + "-err",
          role: "assistant",
          text:
            "Unable to answer question due to an error. Please try again or review the notes directly.",
        },
      ]);
      onSnippetChange(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col h-[420px] md:h-[480px] rounded-3xl border border-white/70 bg-white/94 text-zinc-900 shadow-[0_28px_80px_rgba(0,0,0,0.24)] p-4 md:p-5">
      <div className="mb-3">
        <NoteSourceChips
          sources={sources}
          activeSourceId={activeSourceId}
          onChange={setActiveSourceId}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs md:text-sm mb-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl px-3 py-2 ${
              m.role === "user"
                ? "ml-auto max-w-[65%] bg-emerald-700 text-white"
                : "mr-auto max-w-[80%] bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-50"
            }`}
          >
            <p>{m.text}</p>
            {m.citations && m.citations.length > 0 && (
              <p className="mt-1 text-[0.65rem] text-zinc-600 dark:text-zinc-300">
                Sources: {m.citations.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <label className="text-xs md:text-sm font-medium text-zinc-600">
            Ask a question about this patient&apos;s note
            {activeSourceId !== "all" && (
              <span className="ml-1 text-[0.65rem] md:text-[0.7rem] text-zinc-500">
                (scoped to{" "}
                {sources.find((s) => s.id === activeSourceId)?.label})
              </span>
            )}
          </label>

          <div className="flex items-end gap-2">
            <textarea
              ref={questionInputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!loading) void handleAsk();
                }
              }}
              rows={1}
              placeholder="e.g. What did their last CT show?"
              className="flex-1 rounded-xl border border-zinc-300 bg-white/90 px-3 py-2 text-xs md:text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed resize-none"
            />
            <button
              type="button"
              onClick={handleAsk}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs md:text-sm font-semibold bg-emerald-700 text-white shadow-md disabled:opacity-60"
            >
              {loading ? "Asking…" : "Ask"}
            </button>
            <button
              type="button"
              onClick={() => setQuestion("")}
              className="px-3 py-2 rounded-xl text-[0.7rem] md:text-xs text-zinc-600 hover:bg-zinc-100/80"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="pt-2 mt-1 border-t border-zinc-200 text-[0.65rem] md:text-[0.7rem] text-zinc-500 flex items-center justify-between gap-2">
          <span>
            Answers should be based only on the uploaded note(s). If something is
            not documented, the assistant must say so.
          </span>
          <span className="hidden md:inline">
            Notes are de-identified on your device before analysis, and no PHI is
            stored. Session clears when you leave this page.
          </span>
        </div>
      </div>
    </section>
  );
}
