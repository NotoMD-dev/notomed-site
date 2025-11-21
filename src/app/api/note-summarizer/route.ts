// src/app/api/note-summarizer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";

import type {
  SummaryRequestBody,
  QARequestBody,
  ChatHistoryMessage,
  NoteInput,
} from "@/lib/note-summarizer/types";

import {
  containsLikelyPHI,
  notesContainLikelyPHI,
} from "@/lib/note-summarizer/phi";
import {
  summarizeNotesWithLLM,
  answerQuestionWithLLM,
} from "@/lib/note-summarizer/llm";

/* ---------------- Rate limit ---------------- */
const limiter = new RateLimiterMemory({ points: 20, duration: 60 });

/* ---------------- Type guards ---------------- */
function isNoteInput(note: unknown): note is NoteInput {
  if (typeof note !== "object" || note === null) return false;
  const n = note as { id?: unknown; title?: unknown; text?: unknown };
  return (
    typeof n.id === "string" &&
    n.id.trim().length > 0 &&
    typeof n.title === "string" &&
    typeof n.text === "string"
  );
}

function isHistoryMessage(message: unknown): message is ChatHistoryMessage {
  if (typeof message !== "object" || message === null) return false;
  const m = message as { role?: unknown; text?: unknown };
  return (
    (m.role === "user" || m.role === "assistant") &&
    typeof m.text === "string" &&
    m.text.trim().length > 0
  );
}

function isSummaryBody(body: unknown): body is SummaryRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as { mode?: unknown; notes?: unknown };
  return (
    b.mode === "summary" &&
    Array.isArray(b.notes) &&
    b.notes.every(isNoteInput)
  );
}

function isQABody(body: unknown): body is QARequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as {
    mode?: unknown;
    notes?: unknown;
    question?: unknown;
    activeSourceId?: unknown;
    history?: unknown;
  };
  return (
    b.mode === "qa" &&
    typeof b.question === "string" &&
    b.question.trim().length > 0 &&
    (b.activeSourceId === undefined || typeof b.activeSourceId === "string") &&
    Array.isArray(b.notes) &&
    b.notes.every(isNoteInput) &&
    (b.history === undefined ||
      (Array.isArray(b.history) && b.history.every(isHistoryMessage)))
  );
}

/* ---------------- Handler ---------------- */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  try {
    await limiter.consume(ip);
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  /* ---------- SUMMARY ---------- */
  if (isSummaryBody(bodyUnknown)) {
    if (notesContainLikelyPHI(bodyUnknown.notes)) {
      return NextResponse.json(
        {
          error:
            "Request appears to contain patient identifiers. Please de-identify the note in your browser before submitting.",
        },
        { status: 400 },
      );
    }

    try {
      const summary = await summarizeNotesWithLLM(bodyUnknown.notes);
      return NextResponse.json(summary, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        {
          sections: [],
          rawText: "Summary failed:\n\n" + (error as Error).message,
        },
        { status: 200 },
      );
    }
  }

  /* ---------- Q&A ---------- */
  if (isQABody(bodyUnknown)) {
    const body = bodyUnknown as QARequestBody;

    if (notesContainLikelyPHI(body.notes)) {
      return NextResponse.json(
        {
          error:
            "Request appears to contain patient identifiers. Please de-identify the note in your browser before submitting.",
        },
        { status: 400 },
      );
    }

    if (containsLikelyPHI(body.question)) {
      return NextResponse.json(
        {
          answer:
            "This information was removed during client-side de-identification before processing.",
          citations: [
            "Protected health information (PHI) is intentionally scrubbed and deleted.",
          ],
          snippet:
            "Protected health information (PHI) is intentionally scrubbed and deleted.",
        },
        { status: 200 },
      );
    }

    try {
      const qa = await answerQuestionWithLLM({
        notes: body.notes,
        question: body.question,
        activeSourceId: body.activeSourceId,
        history: body.history,
      });

      return NextResponse.json(
        {
          answer: qa.answer,
          citations: qa.citations,
          snippet: qa.snippet ?? null,
        },
        { status: 200 },
      );
    } catch (error) {
      return NextResponse.json(
        {
          answer: "Unable to answer question.\n\n" + (error as Error).message,
          citations: [],
          snippet: null,
        },
        { status: 200 },
      );
    }
  }

  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}
