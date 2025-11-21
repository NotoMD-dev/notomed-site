// src/app/api/note-summarizer/question/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";

import type { QARequestBody } from "@/lib/note-summarizer/types";
import { answerQuestionWithLLM } from "@/lib/note-summarizer/server";

const limiter = new RateLimiterMemory({ points: 20, duration: 60 });

function isQABody(body: unknown): body is QARequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as QARequestBody;
  return (
    typeof b.question === "string" &&
    b.question.trim().length > 0 &&
    Array.isArray(b.notes) &&
    b.notes.every((n) => typeof n?.text === "string")
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

  if (!isQABody(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { notes, question, activeSourceId, history } = body as QARequestBody;

  try {
    const active = activeSourceId ? notes.find((n) => n.id === activeSourceId) : null;
    const scopeLabel = active ? active.title : undefined;

    const recentHistory = Array.isArray(history)
      ? history
          .filter(
            (h): h is { role: "user" | "assistant"; text: string } =>
              !!h &&
              (h.role === "user" || h.role === "assistant") &&
              typeof h.text === "string",
          )
          .slice(-6)
      : [];
    const historyText =
      recentHistory.length > 0
        ? recentHistory
            .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
            .join("\n")
        : "";

    const enrichedQuestion =
      historyText.length > 0
        ? `Prior conversation:\n${historyText}\n\nCurrent question:\n${question}`
        : question;

    const qa = await answerQuestionWithLLM({
      notes: active ? [active] : notes,
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
