import "server-only";

import type { NoteInput, QAResult, SummaryResult } from "../types";

export async function callOpenAI({
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

export function notesToText(notes: NoteInput[]): string {
  return notes
    .map(
      (n, idx) =>
        `--- NOTE ${idx + 1}: ${n.title || `Note ${idx + 1}`} ---\n${n.text}\n`,
    )
    .join("\n");
}

export function qaNotesToTaggedText(notes: NoteInput[]): string {
  return notes
    .map(
      (n) => `
<note id="${n.id}" title="${n.title || "Untitled note"}">
${n.text}
</note>`.trim(),
    )
    .join("\n\n");
}

type ModelQAJson = {
  answer?: unknown;
  snippet?: unknown;
  source_ids?: unknown;
};

export function parseSummaryText(raw: string): SummaryResult {
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

export function isPHIQuestion(q: string): boolean {
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

export function normalizeQAJson(raw: string, notes: NoteInput[]): QAResult {
  let parsed: ModelQAJson | null = null;
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const jsonText =
      start !== -1 && end !== -1 && end > start ? raw.slice(start, end + 1) : raw;
    parsed = JSON.parse(jsonText) as ModelQAJson;
  } catch {
    return {
      answer: raw.trim(),
      citations: ["Answer grounded in uploaded notes."],
      snippet: "",
    };
  }

  const answer =
    typeof parsed.answer === "string" && parsed.answer.trim().length > 0
      ? parsed.answer.trim()
      : raw.trim();

  const snippet =
    typeof parsed.snippet === "string" && parsed.snippet.trim().length > 0
      ? parsed.snippet.trim()
      : "";

  const candidateIds: string[] = Array.isArray(parsed.source_ids)
    ? parsed.source_ids.filter(
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
