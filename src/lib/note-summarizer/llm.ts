// src/lib/note-summarizer/llm.ts
import type {
  NoteInput,
  SummaryResult,
  QAResult,
  SummaryResponseBody,
} from "./types";

/* ---------------- House styles ---------------- */

const SUMMARY_STYLE = `
You will be given one or more de-identified inpatient clinical notes.

Your job is to produce a concise, structured TEXT summary using the following
exact headings.

IMPORTANT PRIVACY RULE:
You are processing de-identified data. If you encounter a name that appears to be a patient name (e.g., "Mr. Smith") that slipped through redaction, DO NOT include it in the summary. Refer to them as "the patient".

HEADINGS:

# Chief Complaint
<1 sentence>

# HPI
<1–2 sentences focusing only on the current presenting illness and the single most relevant piece of past history. Do NOT exceed 2 sentences.>

# Medications
<short paragraph or bullets summarizing key home meds and inpatient meds>

# Labs
<brief description of most relevant labs only>

# Imaging
<brief description of key imaging findings>

# Consultants
<Provide a concise numbered list of consultants>

# Hospital Course
<1-4 sentences describing major events by hospital day>

# Timeline
<very short chronological summary: symptom onset → ED → wards/ICU → current status

# Problem List
<Output one active problem per line, each starting with "# " and with NO trailing "#". Example:
# Acute hypoxic respiratory failure
# Sepsis secondary to pneumonia
# Type 2 diabetes mellitus>

# Changes Between Notes
<Describe clinically meaningful changes if multiple notes exist.>

Rules:
- Use ONLY the facts from the provided notes.
- If a section or information is not available or clearly documented, write: "Not clearly documented in the provided notes."
- Do NOT invent new diagnoses or consultants.
- Do NOT output JSON. Output plain text only.
`.trim();

// ⬇️ Replace your existing QA_STYLE with this
const QA_STYLE = `
You are a careful clinical note summarization assistant.

You will receive:
- One or more de-identified inpatient notes, each wrapped in an XML-like block:
  <note id="note-1" title="H&P / ADMISSION">
  ... note text ...
  </note>
- An optional note filter.
- A user question (possibly with prior conversation history).

Your job is to answer ONLY using the information documented in these notes.

Style rules:
- Prefer the SHORTEST complete answer (usually 1–3 sentences).
- Do NOT add extra background unless asked.
- Do NOT paste long contiguous blocks of the original note.
- Rephrase information in your own words instead of copying it.
- Do not rephrase the question in your answer, just give the answer.
- When listing items (problems, diagnoses, meds, labs), give a clean,
  human-readable numbered list.
- Avoid hedging phrases like "including", "such as", or "for example".
  Instead, list all items you can find; if the list is obviously partial,
  say that the notes only partially document the information.

Medication-specific rules:
- When asked about home meds or discharge meds, present a compact list:
  "1. Medication, dose, frequency (and route if stated)
   2. Medication, dose, frequency (and route if stated)
  etc.".
- Group obvious supply items together (e.g., lancets, test strips,
  pen needles) under a single "Supplies" bullet.
- Do not repeat the same supply multiple times with only minor variations.

Lab & imaging rules:
- For labs, list only clearly documented values that are relevant
  to the question.
- For each lab, include value and units if present; do not interpret
  borderline-normal values as abnormal.
- If a value is at the borderline of normal, explicitly mention that it
  is at the lower or upper limit of normal instead of calling it abnormal.

Safety & Privacy rules:
- If the answer is not documented, say EXACTLY:
  "This is not clearly documented in the provided notes."
- If the information is redacted (appears as [REDACTED_*]), say EXACTLY:
  "This information has been redacted for patient privacy."
- If you see a patient name that somehow was not redacted, you MUST reply:
  "The patient's name has been removed for privacy."
- If you are asked for any direct identifiers (name, full date of birth,
  full address, phone number, email, MRN, emergency contact, employer, next of kin, etc)
  reply EXACTLY:
  "This information was removed during client-side de-identification before processing."
- Never guess or reconstruct redacted information.
- NEVER invent labs, imaging results, or diagnoses.

VERY IMPORTANT – SOURCE TRACKING:
- You MUST track which note(s) you use as evidence.
- Each note appears as: <note id="note-1" title="..."> ... </note>.
- When you quote evidence in the snippet, you MUST know which note id(s)
  that evidence came from.

Output requirements:
- You MUST output VALID JSON ONLY, with NO extra commentary or markdown.
- Use this exact shape:

{
  "answer": "short direct answer string",
  "snippet": "short supporting quote from the note, or an empty string if none is appropriate",
  "source_ids": ["note-1", "note-2"]
}

Rules for "source_ids":
- Each entry MUST exactly match one of the ids from the <note id="..."> blocks.
- Only include a note id if the text in "snippet" can actually be found in that note.
- If the snippet appears in multiple notes (copy-pasted text), list all of them.
- If you are unsure which note contains the snippet, use an empty array: "source_ids": [].

Do NOT wrap the JSON in backticks.
Do NOT add any explanation before or after the JSON.
`.trim();


/* ---------------- Shared OpenAI caller ---------------- */

async function callOpenAI({
  system,
  user,
}: {
  system: string;
  user: string;
}): Promise<string> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? "gpt-4o-mini",
      temperature: Number(process.env.AI_TEMPERATURE ?? 0.2),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text.slice(0, 800));
  }

  const json = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string | null } | null }>;
  };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("No content from model.");
  return content;
}

/* ---------------- Helpers ---------------- */

function notesToText(notes: NoteInput[]): string {
  return notes
    .map(
      (n, idx) =>
        `--- NOTE ${idx + 1}: ${n.title || `Note ${idx + 1}`} ---\n${n.text}\n`,
    )
    .join("\n");
}

function qaNotesToTaggedText(notes: NoteInput[]): string {
  return notes
    .map(
      (n) => `
<note id="${n.id}" title="${n.title || "Untitled note"}">
${n.text}
</note>`.trim(),
    )
    .join("\n\n");
}

// Normalizes text for comparison (strips punctuation/whitespace, lowers case)
function parseSummaryText(raw: string): SummaryResult {
  const sectionOrder: {
    id: SummaryResult["sections"][number]["id"];
    title: string;
  }[] = [
    { id: "chiefComplaint", title: "Chief Complaint" },
    { id: "hpi", title: "HPI" },
    { id: "medications", title: "Medications" },
    { id: "labs", title: "Labs" },
    { id: "imaging", title: "Imaging" },
    { id: "consultants", title: "Consultants" },
    { id: "hospitalCourse", title: "Hospital Course" },
    { id: "timeline", title: "Timeline" },
    { id: "problemList", title: "Problem List" },
    { id: "changesBetweenNotes", title: "Changes Between Notes" },
  ];

  const sections: SummaryResult["sections"] = [];

  for (let i = 0; i < sectionOrder.length; i++) {
    const { id, title } = sectionOrder[i];
    const heading = `# ${title}`;
    const start = raw.indexOf(heading);
    if (start === -1) {
      sections.push({
        id,
        title,
        content: "Not clearly documented in the provided notes.",
      });
      continue;
    }
    const afterHeading = start + heading.length;
    const end =
      i + 1 < sectionOrder.length
        ? raw.indexOf(`# ${sectionOrder[i + 1].title}`, afterHeading)
        : raw.length;
    const content = raw
      .slice(afterHeading, end === -1 ? raw.length : end)
      .trim()
      .replace(/^\s+|\s+$/g, "");
    sections.push({
      id,
      title,
      content: content || "Not clearly documented in the provided notes.",
    });
  }

  return { sections };
}

function isPHIQuestion(q: string): boolean {
  const lower = q.toLowerCase();

  const namePatterns = [
    "patient's name",
    "patients name",
    "what is the name",
    "full name",
    "first name",
    "last name",
  ];

  const dobPatterns = ["dob", "date of birth", "birth date", "birthday"];

  const idPatterns = [
    "mrn",
    "medical record number",
    "account number",
    "social security",
    "ssn",
  ];

  const contactPatterns = [
    "phone number",
    "telephone",
    "email address",
    "home address",
    "street address",
    "where do they live",
  ];

  const all = [
    ...namePatterns,
    ...dobPatterns,
    ...idPatterns,
    ...contactPatterns,
  ];

  return all.some((frag) => lower.includes(frag));
}

/* ---------------- Public API ---------------- */

type ParsedQAResponse = {
  answer?: unknown;
  snippet?: unknown;
  source_ids?: unknown;
  citations?: unknown;
};

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

export async function answerQuestionWithLLM(args: {
  notes: NoteInput[];
  question: string;
  activeSourceLabel?: string;
}): Promise<QAResult> {
  const { notes, question, activeSourceLabel } = args;

  // PHI safety shortcut
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

  // Wrap notes with IDs for the model
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

  // Try to extract a JSON object from the model's response
  let parsed: unknown = null;
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const jsonText =
      start !== -1 && end !== -1 && end > start ? raw.slice(start, end + 1) : raw;
    parsed = JSON.parse(jsonText) as ParsedQAResponse;
  } catch {
    // Hard fallback: treat the whole thing as a plain-text answer
    return {
      answer: raw.trim(),
      citations: ["Answer grounded in uploaded notes."],
      snippet: "",
    };
  }

  const parsedObject: ParsedQAResponse =
    parsed && typeof parsed === "object" ? (parsed as ParsedQAResponse) : {};

  const answer =
    typeof parsedObject.answer === "string" && parsedObject.answer.trim().length > 0
      ? parsedObject.answer.trim()
      : raw.trim();

  const snippet =
    typeof parsedObject.snippet === "string" && parsedObject.snippet.trim().length > 0
      ? parsedObject.snippet.trim()
      : "";

  const candidateIds: string[] = Array.isArray(parsedObject.source_ids)
    ? parsedObject.source_ids.filter(
        (id: unknown) => typeof id === "string" && id.trim().length > 0,
      )
    : [];

  const validNoteIds = new Set(notes.map((n) => n.id));
  const filteredIds = candidateIds.filter((id) => validNoteIds.has(id));

  const citations =
    filteredIds.length > 0
      ? filteredIds
      : ["Answer grounded in uploaded notes."];

  return { answer, citations, snippet };
}
