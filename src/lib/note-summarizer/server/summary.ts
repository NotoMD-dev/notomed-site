import "server-only";

import type { NoteInput, SummaryResponseBody } from "../types";
import { SUMMARY_STYLE } from "./prompts";
import { callOpenAI, notesToText, parseSummaryText } from "./shared";

export async function summarizeNotesWithLLM(
  notes: NoteInput[],
): Promise<SummaryResponseBody> {
  const notesText = notesToText(notes);
  const user = `
<<STYLE>>
${SUMMARY_STYLE}
<</STYLE>>

<<NOTES>>
${notesText}
<</NOTES>>

Generate the structured summary now.
`.trim();

  const raw = await callOpenAI({
    system:
      "You are a meticulous internal medicine physician summarizing de-identified inpatient notes.",
    user,
  });

  const parsed = parseSummaryText(raw);
  return { ...parsed, rawText: raw };
}
