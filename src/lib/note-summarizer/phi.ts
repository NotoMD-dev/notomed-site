import type { NoteInput } from "./types";

/**
 * Light PHI heuristics for server-side validation.
 *
 * These helpers are intentionally conservative: they only detect obvious
 * identifiers or PHI-seeking questions so the backend can reject risky
 * requests without attempting to scrub or mutate the text.
 */
const HARD_IDENTIFIER_PATTERNS: RegExp[] = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // email
  /\bhttps?:\/\/[^\s]+/i, // URLs
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, // phone/fax
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN-like
  /\b(?:MRN|Med(?:ical)?\s*Record|Chart\s*Number|Account\s*Number)\s*[:#]?[ \t]*[A-Za-z0-9-]+\b/i, // MRN labels
  /\b\d{7,10}\b/, // bare IDs
  /\b(?:DOB|Date of Birth|Birthdate)\b[^\n]*\d{2,4}/i, // DOB lines with digits
  /\b\d{1,5}\s+[A-Za-z0-9.\-]+\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way|Terrace|Ter|Place|Pl|Circle|Cir|Hwy|Highway)\b/i, // street addresses
];

const PHI_REQUEST_KEYWORDS = [
  "patient's name",
  "patients name",
  "full name",
  "first name",
  "last name",
  "mrn",
  "medical record number",
  "account number",
  "social security",
  "ssn",
  "date of birth",
  "dob",
  "phone number",
  "telephone",
  "email address",
  "home address",
  "street address",
  "where do they live",
];

export function containsLikelyPHI(text: string | undefined | null): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  for (const pattern of HARD_IDENTIFIER_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  const lower = trimmed.toLowerCase();
  const looksLikeQuestion = /\?|^\s*(what|who|where|when|how)\b/i.test(trimmed);

  return looksLikeQuestion
    ? PHI_REQUEST_KEYWORDS.some((frag) => lower.includes(frag))
    : false;
}

export function notesContainLikelyPHI(notes: NoteInput[]): boolean {
  return notes.some((note) =>
    containsLikelyPHI(note.text) || containsLikelyPHI(note.title),
  );
}
