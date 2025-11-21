// src/app/api/note-summarizer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";

import type {
  SummaryRequestBody,
  QARequestBody,
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
function isSummaryBody(body: unknown): body is SummaryRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as { mode?: unknown; notes?: unknown };
  return (
    b.mode === "summary" &&
    Array.isArray(b.notes) &&
    b.notes.every((n): n is SummaryRequestBody["notes"][number] => {
      const note = n as { text?: unknown };
      return typeof note?.text === "string";
    })
  );
}

function isQABody(body: unknown): body is QARequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as { mode?: unknown; notes?: unknown; question?: unknown };
  return (
    b.mode === "qa" &&
    typeof b.question === "string" &&
    b.question.trim().length > 0 &&
    Array.isArray(b.notes) &&
    b.notes.every((n): n is QARequestBody["notes"][number] => {
      const note = n as { text?: unknown };
      return typeof note?.text === "string";
    })
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
            "Request appears to contain patient identifiers. Please de-identify notes in your browser before submitting.",
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
    const body = bodyUnknown as QARequestBody & {
      history?: { role: "user" | "assistant"; text: string }[];
      activeSourceId?: string | null;
    };

    try {
      if (notesContainLikelyPHI(body.notes)) {
        return NextResponse.json(
          {
            error:
              "Request appears to contain patient identifiers. Please de-identify content in your browser before submitting.",
          },
          { status: 400 },
        );
      }

      const active =
        body.activeSourceId &&
        body.notes.find((n) => n.id === body.activeSourceId);

      const scopeLabel = active ? active.title : undefined;

      const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

      const lastMessage = history.at(-1);
      const lastUserTurnText = lastMessage?.role === "user" ? lastMessage.text : undefined;

      const safeHistory = history.filter((m) => !containsLikelyPHI(m.text));

      const historyText =
        safeHistory.length > 0
          ? safeHistory
              .map(
                (m) =>
                  `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`,
              )
              .join("\n")
          : "";

      if (
        containsLikelyPHI(body.question) ||
        containsLikelyPHI(lastUserTurnText)
      ) {
        return NextResponse.json(
          {
            answer:
              "This information was removed during client-side de-identification before processing.",
            citations: [
              "Protected health information (PHI) is intentionally scrubbed and deleted.",
            ],
            snippet: null,
          },
          { status: 200 },
        );
      }

      const enrichedQuestion =
        historyText.length > 0
          ? `Prior conversation:\n${historyText}\n\nCurrent question:\n${body.question}`
          : body.question;

      const qa = await answerQuestionWithLLM({
        notes: active ? [active] : body.notes,
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
