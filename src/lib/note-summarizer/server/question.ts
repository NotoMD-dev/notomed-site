import "server-only";

import type { NoteInput, QAResult } from "../types";
import { QA_STYLE } from "./prompts";
import {
  callOpenAI,
  qaNotesToTaggedText,
  isPHIQuestion,
  normalizeQAJson,
} from "./shared";

export async function answerQuestionWithLLM(args: {
  notes: NoteInput[];
  question: string;
  activeSourceLabel?: string;
}): Promise<QAResult> {
  const { notes, question, activeSourceLabel } = args;

  if (isPHIQuestion(question)) {
    return {
      answer:
        "This information was removed during client-side de-identification before processing.",
      citations: [
        "Protected health information (PHI) is intentionally scrubbed and deleted.",
      ],
      snippet: undefined,
    };
  }

  const notesText = qaNotesToTaggedText(notes);

  const user = `
<<STYLE>>
${QA_STYLE}
<</STYLE>>

<<NOTES>>
${notesText}
<</NOTES>>

<<QUESTION>>
${question}
<</QUESTION>>

<<SCOPE>>
${activeSourceLabel ?? "Use all notes; if multiple notes conflict, describe the differences."}
<</SCOPE>>
`.trim();

  const raw = await callOpenAI({
    system:
      "You are a careful clinical note summarization assistant. You never invent data and only summarize what is documented.",
    user,
  });

  return normalizeQAJson(raw, notes);
}
