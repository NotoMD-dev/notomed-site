// src/app/api/note-summarizer/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";

import type { SummaryRequestBody } from "@/lib/note-summarizer/types";
import { summarizeNotesWithLLM } from "@/lib/note-summarizer/server";

const limiter = new RateLimiterMemory({ points: 20, duration: 60 });

function isSummaryBody(body: unknown): body is SummaryRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as SummaryRequestBody;
  return Array.isArray(b.notes) && b.notes.every((n) => typeof n?.text === "string");
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

  if (!isSummaryBody(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const summary = await summarizeNotesWithLLM(body.notes);
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
