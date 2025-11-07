// src/app/api/feedback/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { id, tool, message } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // upsert so dev double-calls don't create two rows
    const { error } = await supabase
      .from("feedback")
      .upsert(
        {
          id, // 👈 this comes from the client (crypto.randomUUID())
          tool: tool ?? null,
          message: message.trim(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Feedback route error:", err);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
