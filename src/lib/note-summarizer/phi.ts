import type { NoteInput } from "./types";

/**
 * Lightweight PHI detector (not a scrubber!).
 *
 * These regexes look for hard identifiers that should have already been
 * removed in the browser. If they appear here, the request should be rejected
 * rather than "fixed" server-side.
 */
const HARD_IDENTIFIER_PATTERNS: RegExp[] = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // emails
  /\bhttps?:\/\/[^\s]+/gi, // urls
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // phone/fax numbers
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN-like
  /\b(?:MRN|Med(?:ical)?\s*Record|Chart\s*Number|Account\s*Number)\s*[:#]?[ \t]*[A-Za-z0-9-]+\b/gi, // MRN/account labels
  /\b\d{7,10}\b/g, // bare 7–10 digit IDs
  /\b(?:DOB|Date of Birth|Birthdate)\b[^\n]*/gi, // DOB lines
  /\b\d{1,5}\s+[A-Za-z0-9.\-]+(?:\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way|Terrace|Ter|Place|Pl|Circle|Cir|Hwy|Highway))\.?\b/gi, // simple addresses
];

export function containsLikelyPHI(text: string | undefined | null): boolean {
  if (!text) return false;
  return HARD_IDENTIFIER_PATTERNS.some((re) => {
    re.lastIndex = 0;
    return re.test(text);
  });
}

export function notesContainLikelyPHI(notes: NoteInput[]): boolean {
  return notes.some((note) =>
    containsLikelyPHI(note.text) || containsLikelyPHI(note.title),
  );
}
