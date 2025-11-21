// src/app/api/note-summarizer/question/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";

import type { QARequestBody } from "@/lib/note-summarizer/types";
import { answerQuestionWithLLM } from "@/lib/note-summarizer/server";

const limiter = new RateLimiterMemory({ points: 30, duration: 60 });

function isValidHistory(value: unknown): value is QARequestBody["history"] {
  return (
    Array.isArray(value) &&
    value.every(
      (m) =>
        typeof m?.role === "string" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m?.text === "string",
    )
  );
}

function isValidQABody(body: unknown): body is QARequestBody {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as QARequestBody;
  return (
    typeof candidate.question === "string" &&
    candidate.question.trim().length > 0 &&
    Array.isArray(candidate.notes) &&
    candidate.notes.length > 0 &&
    candidate.notes.every((n) => typeof n?.text === "string")
  );
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  try {
    await limiter.consume(ip);
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidQABody(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { notes, question, activeSourceId } = body;
  const history = isValidHistory((body as QARequestBody).history)
    ? (body as QARequestBody).history.slice(-6)
    : [];

  const historyText =
    history.length > 0
      ? history
          .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
          .join("\n")
      : "";

  const enrichedQuestion =
    historyText.length > 0
      ? `Prior conversation:\n${historyText}\n\nCurrent question:\n${question}`
      : question;

  const activeNote =
    activeSourceId && activeSourceId !== "all"
      ? notes.find((n) => n.id === activeSourceId)
      : null;

  const scopeLabel = activeNote ? activeNote.title : undefined;

  try {
    const qa = await answerQuestionWithLLM({
      notes: activeNote ? [activeNote] : notes,
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
        error: "Unable to answer question",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
