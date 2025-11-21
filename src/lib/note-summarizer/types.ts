// src/lib/note-summarizer/types.ts

export type NoteKind =
  | "unknown"
  | "admission"
  | "progress"
  | "discharge"
  | "consult"
  | "operative"
  | "procedure"
  | "other";

export interface NoteInput {
  id: string;
  title: string;
  text: string;
  kind?: NoteKind;
}

export type NoteSectionId =
  | "chiefComplaint"
  | "hpi"
  | "medications"
  | "labs"
  | "imaging"
  | "consultants"
  | "hospitalCourse"
  | "timeline"
  | "problemList"
  | "changesBetweenNotes";

export interface SectionSummary {
  id: NoteSectionId;
  title: string;
  content: string;
}

export interface SummaryResult {
  sections: SectionSummary[];
}

export interface QAResult {
  answer: string;
  /**
   * For QA, this is now used as:
   * - normally: a list of note IDs (e.g. ["note-1", "note-2"]) identifying which notes were used
   * - PHI safety branch: a generic explanatory string
   */
  citations: string[];
  // short supporting quote from the note
  snippet?: string;
}

export interface SummaryRequestBody {
  notes: NoteInput[];
}

export interface QARequestBody {
  notes: NoteInput[];
  question: string;
  activeSourceId?: string; // "all" or one of notes[].id
  history?: { role: "user" | "assistant"; text: string }[];
}

export interface SummaryResponseBody extends SummaryResult {
  // surfaced for debugging if you want later
  rawText?: string;
}

export type QAResponseBody = QAResult;

export type NoteSummarizerResponseBody =
  | SummaryResponseBody
  | QAResponseBody;
