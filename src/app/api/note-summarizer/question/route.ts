import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";

import { scrubNotes, scrubObject } from "@/lib/note-summarizer/phi";
import { answerQuestionWithLLM } from "@/lib/note-summarizer/server/llm";
import type { QARequestBody } from "@/lib/note-summarizer/types";

const limiter = new RateLimiterMemory({ points: 20, duration: 60 });

function isQABody(body: unknown): body is QARequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Partial<QARequestBody> & { [key: string]: unknown };
  return (
    typeof b.question === "string" &&
    b.question.trim().length > 0 &&
    Array.isArray(b.notes) &&
    b.notes.every((n) => typeof n?.text === "string")
  );
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

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

  if (!isQABody(bodyUnknown)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const body = bodyUnknown;

  try {
    const redactedNotes = scrubNotes(body.notes);

    const active = body.activeSourceId
      ? redactedNotes.find((n) => n.id === body.activeSourceId)
      : undefined;

    const scopeLabel = active ? active.title : undefined;

    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

    const historyText =
      history.length > 0
        ? history
            .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
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
