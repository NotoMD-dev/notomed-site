import type { NoteInput } from "./types";

/**
 * Lightweight PHI detection helpers for server-side validation.
 *
 * These functions should only be used to REJECT requests that appear to
 * contain identifiers. They must never mutate or "fix" incoming data.
 */

const PHI_PATTERNS: RegExp[] = [
  // Emails
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  // Phone or fax numbers (US-ish)
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  // SSN-like patterns
  /\b\d{3}-\d{2}-\d{4}\b/,
  // MRN/account labels with values
  /\b(?:MRN|Med(?:ical)?\s*Record|Chart\s*Number|Account\s*Number)\s*[:#]?[ \t]*[A-Za-z0-9-]+\b/i,
  // Bare 7–10 digit IDs (often MRN/account)
  /\b\d{7,10}\b/,
  // DOB lines
  /\b(?:DOB|Date of Birth|Birthdate)\b[^\n]*/i,
  // Simple US-style addresses
  /\b\d{1,5}\s+[A-Za-z0-9.\-]+(?:\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way|Terrace|Ter|Place|Pl|Circle|Cir|Hwy|Highway))\.?\b/i,
];

export function containsLikelyPHIText(text: string | undefined | null): boolean {
  if (!text) return false;
  return PHI_PATTERNS.some((pattern) => pattern.test(text));
}

export function notesContainLikelyPHI(notes: NoteInput[]): boolean {
  return notes.some(
    (note) =>
      containsLikelyPHIText(note.text) || containsLikelyPHIText(note.title),
  );
}
