// src/app/api/note-summarizer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";

import type {
  SummaryRequestBody,
  QARequestBody,
} from "@/lib/note-summarizer/types";

import { scrubNotes, scrubObject } from "@/lib/note-summarizer/phi";
import {
  summarizeNotesWithLLM,
  answerQuestionWithLLM,
} from "@/lib/note-summarizer/llm";

/* ---------------- Rate limit ---------------- */
const limiter = new RateLimiterMemory({ points: 20, duration: 60 });

/* ---------------- Type guards ---------------- */
function isSummaryBody(body: unknown): body is SummaryRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as any;
  return (
    b.mode === "summary" &&
    Array.isArray(b.notes) &&
    b.notes.every((n: any) => typeof n?.text === "string")
  );
}

function isQABody(body: unknown): body is QARequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as any;
  return (
    b.mode === "qa" &&
    typeof b.question === "string" &&
    b.question.trim().length > 0 &&
    Array.isArray(b.notes) &&
    b.notes.every((n: any) => typeof n?.text === "string")
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
    const raw = await req.json();
    bodyUnknown = scrubObject(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  /* ---------- SUMMARY ---------- */
  if (isSummaryBody(bodyUnknown)) {
    try {
      const redactedNotes = scrubNotes(bodyUnknown.notes);
      const summary = await summarizeNotesWithLLM(redactedNotes);
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
    const body = bodyUnknown as QARequestBody & {
      history?: { role: "user" | "assistant"; text: string }[];
      activeSourceId?: string | null;
    };

    try {
      const redactedNotes = scrubNotes(body.notes);

      const active =
        body.activeSourceId &&
        redactedNotes.find((n) => n.id === body.activeSourceId);

      const scopeLabel = active ? active.title : undefined;

      const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

      const historyText =
        history.length > 0
          ? history
              .map(
                (m) =>
                  `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`,
              )
              .join("\n")
          : "";

      const enrichedQuestion =
        historyText.length > 0
          ? `Prior conversation:\n${historyText}\n\nCurrent question:\n${body.question}`
          : body.question;

      const qa = await answerQuestionWithLLM({
        notes: active ? [active] : redactedNotes,
        question: enrichedQuestion,
        activeSourceLabel: scopeLabel,
      });

      return NextResponse.json(
        {
          answer: qa.answer,
          citations: qa.citations,
          snippet: qa.snippet ?? null,   // ⭐ NEW
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
