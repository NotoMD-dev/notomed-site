"use client";

import type { NoteInput } from "./types";

/**
 * v5.0 client-side PHI scrubber.
 *
 * Major Fixes:
 *  - MOVED Family/Relation detection from "Hard Scrub" to "Name Discovery".
 *    This ensures that "Sister: Mary" adds "Mary" to the blocklist
 *    so it gets redacted everywhere, not just in that one line.
 *  - Added support for double-colons (e.g., "Relation: Sister: Mary").
 *  - Added support for "Secondary/Primary Emergency Contact".
 */

/* ------------------------------------------------------------------ */
/* 1. Hard identifiers: MRN, phone, email, DOB line, address, etc.    */
/* ------------------------------------------------------------------ */

function scrubHardIdentifiers(text: string): string {
  let out = text;
  if (!out) return out;

  // Emails
  out = out.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[REDACTED_EMAIL]",
  );

  // URLs
  out = out.replace(/\bhttps?:\/\/[^\s]+/gi, "[REDACTED_URL]");

  // Phone / fax numbers
  out = out.replace(
    /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    "[REDACTED_PHONE]",
  );

  // SSN-like
  out = out.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_ID]");

  // MRN / Account Numbers
  out = out.replace(
    /\b(?:MRN|Med(?:ical)?\s*Record|Chart\s*Number|Account\s*Number)\s*[:#]?[ \t]*[A-Za-z0-9-]+\b/gi,
    "[REDACTED_ID]",
  );

  // Bare 7–10 digit IDs
  out = out.replace(/\b\d{7,10}\b/g, "[REDACTED_ID]");

  // DOB lines
  out = out.replace(
    /\b(?:DOB|Date of Birth|Birthdate)\b[^\n]*/gi,
    "[REDACTED_DOB_LINE]",
  );

  // Addresses
  out = out.replace(
    /\b\d{1,5}\s+[A-Za-z0-9.\-]+(?:\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way|Terrace|Ter|Place|Pl|Circle|Cir|Hwy|Highway))\.?\b/gi,
    "[REDACTED_ADDRESS]",
  );

  /* 
     NOTE: We removed the "Family Member" scrubbing from here.
     It is now handled in findPatientNameCandidates below.
     This ensures names found in "Sister: Mary" are redacted globally.
  */

  /* ---------------- Employer names (keep role) ---------------------- */
  out = out.replace(
    /\b(works|employed)\s+(as an?)\s+([^,.]+?)\s+(at|for)\s+[^,.]+/gi,
    "$1 $2 $3",
  );

  return out;
}

/* ------------------------------------------------------------------ */
/* 2. Enhanced Name Detection                                         */
/* ------------------------------------------------------------------ */

function findPatientNameCandidates(text: string): string[] {
  const candidates: string[] = [];
  let match: RegExpExecArray | null;

  // ------------------------------------------------------
  // A. HEADERS & LABELS
  // ------------------------------------------------------
  // Matches:
  // - "Name: John Doe"
  // - "Emergency Contact: JANE, DOE"
  // - "Secondary Emergency Contact: Soledad"
  // - "Primary Care Provider: Dr. Smith" (Will be filtered later if "Dr" is caught)
  
  const headerRegex = 
    /\b(?:Name|Patient|Pt|Contact|Kin|POA|Proxy|Provider)\s*[:\-#]\s*([A-Za-z]+(?:,\s*[A-Za-z]+)+|[A-Za-z]+(?:\s+[A-Za-z]+){0,3})/gi;

  while ((match = headerRegex.exec(text)) !== null) {
    // Filter out generic words that might be caught
    if (!/^(None|TBD|Sister|Brother|Mother|Father|Spouse|Same|Call)$/i.test(match[1])) {
       candidates.push(match[1]);
    }
  }

  // ------------------------------------------------------
  // B. RELATIONS & FAMILY (The Fix for "Sister: Soledad")
  // ------------------------------------------------------
  // Matches: "Sister: Soledad", "Sister Soledad", "Husband: John"
  // We look for the Relationship word, optional colon, then the Name.
  
  const relationRegex = 
    /\b(?:Relation|Sister|Brother|Mother|Father|Spouse|Wife|Husband|Son|Daughter|Partner)\s*[:\-]?\s+([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)/g;
  
  while ((match = relationRegex.exec(text)) !== null) {
    candidates.push(match[1]);
  }

  // ------------------------------------------------------
  // C. NARRATIVE OPENERS
  // ------------------------------------------------------
  // "John Smith is a 45-year-old..."
  const hpiIsRegex =
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+is a\s+\d{1,3}[- ]year[- ]old\b/g;
  while ((match = hpiIsRegex.exec(text)) !== null) {
    candidates.push(match[1]);
  }

  // "John Smith, a 45-year-old..."
  const hpiCommaRegex =
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}),\s+a\s+\d{1,3}[- ]year[- ]old\b/g;
  while ((match = hpiCommaRegex.exec(text)) !== null) {
    candidates.push(match[1]);
  }

  // ------------------------------------------------------
  // D. HONORIFICS
  // ------------------------------------------------------
  // "Mr. Smith", "Ms. Doe"
  const honorificRegex =
    /\b(?:Mr|Ms|Mrs|Mx|Miss)\.?\s+([A-Z][a-z]+(?:[-'][A-Z][a-z]+)?)/g;
  while ((match = honorificRegex.exec(text)) !== null) {
    candidates.push(match[1]);
  }

  return candidates;
}

function extractPatientNameTokens(candidates: string[]): Set<string> {
  const tokens = new Set<string>();

  for (const full of candidates) {
    // Split by spaces AND commas (handles "SALVADOR,EDITH")
    full
      .split(/[\s,]+/) 
      .map((t) => t.replace(/[^A-Za-z-]/g, "")) // Clean punctuation
      .filter((t) => t.length > 2) // Skip 1-2 letter words
      .forEach((t) => tokens.add(t));
  }

  return tokens;
}

/**
 * Scrub the given tokens anywhere they appear.
 */
function scrubPatientNameTokens(text: string, tokens: Set<string>): string {
  if (!text) return text;

  let out = text;

  // 1. Blind Scrub Honorifics (Safety net)
  out = out.replace(
    /\b(Mr|Ms|Mrs|Mx|Miss)\.?\s+([A-Z][a-z]+)\b/g,
    "$1 [REDACTED_NAME]"
  );

  // 2. Scrub detected tokens
  if (tokens.size > 0) {
    const sorted = Array.from(tokens).sort((a, b) => b.length - a.length);

    for (const token of sorted) {
      if (!token) continue;

      // Blocklist: Don't redact these common words even if found in name slots
      // Added months and common medical terms to prevent over-redaction
      if (/^(Mr|Ms|Mrs|Dr|Doctor|Pt|Patient|Male|Female|Sister|Brother|Mother|Father|Mom|Dad|Wife|Husband|Spouse|Son|Daughter|None|TBD|Heme|Onc|Labs|Date|May|June|July|March|April|August)$/i.test(token))
        continue;

      // Regex: Match token as whole word
      // Negative lookbehind: Ensure not preceded by Dr/Doctor
      const pattern = new RegExp(
        `(?<!Dr\\.?\\s)(?<!Doctor\\s)\\b${token}\\b`,
        "gi",
      );

      out = out.replace(pattern, "[REDACTED_NAME]");
    }
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* 3. Public helpers for the UI                                      */
/* ------------------------------------------------------------------ */

export function scrubNoteClientSide(note: NoteInput): NoteInput {
  const originalText = note.text ?? "";
  const originalTitle = note.title ?? "";

  // 1) Scrub hard identifiers
  const hardScrubbedText = scrubHardIdentifiers(originalText);
  const hardScrubbedTitle = scrubHardIdentifiers(originalTitle);

  // 2) Detect probable names (Now includes Family/Relations)
  const nameCandidates = findPatientNameCandidates(hardScrubbedText);
  const patientTokens = extractPatientNameTokens(nameCandidates);

  // 3) Scrub those tokens everywhere
  const finalText = scrubPatientNameTokens(hardScrubbedText, patientTokens);
  const finalTitle = scrubPatientNameTokens(hardScrubbedTitle, patientTokens);

  return {
    ...note,
    text: finalText,
    title: finalTitle,
  };
}

export function scrubNotesClientSide(notes: NoteInput[]): NoteInput[] {
  return notes.map(scrubNoteClientSide);
}