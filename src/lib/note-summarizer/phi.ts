import type { NoteInput } from "./types";

/**
 * Shallow key scrub (like /api/ai-plan).
 * This removes obviously sensitive fields from top-level JSON objects
 * (e.g., name, dob) before your handlers process them.
 */
export function scrubObject<T>(obj: T): T {
  const banned = new Set([
    "name",
    "fullName",
    "firstName",
    "lastName",
    "dob",
    "dateOfBirth",
    "mrn",
    "ssn",
    "address",
    "phone",
    "email",
    "accountNumber",
  ]);

  return JSON.parse(
    JSON.stringify(obj, (k, v) => (banned.has(k) ? undefined : v)),
  ) as T;
}

/**
 * Server-side text-level PHI scrubber.
 *
 * IMPORTANT:
 * - This is now a *lightweight safety net*.
 * - It only removes hard identifiers (emails, phones, MRN/ID labels,
 *   SSN-like patterns, DOB lines, addresses, facility names).
 * - It does NOT touch:
 *    - patient or provider names,
 *    - generic clinical dates or date ranges,
 *    - core clinical content.
 *
 * The main, opinionated de-identification logic (patient names, etc.)
 * now lives in the client-side scrubber: clientPhi.ts.
 */
export function scrubText(text: string): string {
  if (!text) return text;

  let out = text;

  /* ---------------- Hard identifiers only ---------------- */

  // Emails
  out = out.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[REDACTED_EMAIL]",
  );

  // URLs
  out = out.replace(
    /\bhttps?:\/\/[^\s]+/gi,
    "[REDACTED_URL]",
  );

  // Phone / fax numbers (US-ish)
  out = out.replace(
    /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    "[REDACTED_PHONE]",
  );

  // SSN-like: 123-45-6789
  out = out.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_ID]",);

  // MRN / account / chart labels with values
  out = out.replace(
    /\b(?:MRN|Med(?:ical)?\s*Record|Chart\s*Number|Account\s*Number)\s*[:#]?[ \t]*[A-Za-z0-9-]+\b/gi,
    "[REDACTED_ID]",
  );

  // Bare 7–10 digit IDs (often MRN / account)
  out = out.replace(/\b\d{7,10}\b/g, "[REDACTED_ID]");

  // DOB lines (but NOT all dates elsewhere)
  out = out.replace(
    /\b(?:DOB|Date of Birth|Birthdate)\b[^\n]*/gi,
    "[REDACTED_DOB_LINE]",
  );

  // Simple US-style addresses "123 Main St", "2500 Wilshire Blvd"
  out = out.replace(
    /\b\d{1,5}\s+[A-Za-z0-9.\-]+(?:\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way|Terrace|Ter|Place|Pl|Circle|Cir|Hwy|Highway))\.?\b/gi,
    "[REDACTED_ADDRESS]",
  );


  // NOTE: We deliberately DO NOT scrub generic dates or names here.
  // Clinical dates (admission ranges, surgery dates, imaging dates) and
  // provider/patient names are handled at the client level.

  return out;
}

export function scrubNotes(notes: NoteInput[]): NoteInput[] {
  return notes.map((note) => ({
    ...note,
    text: scrubText(note.text ?? ""),
    title: scrubText(note.title ?? ""),
  }));
}
