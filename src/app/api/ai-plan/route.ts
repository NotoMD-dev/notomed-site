// /app/api/ai-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";

import {
  getAIPlanFromPatientInputs,
  type PatientInputs,
  type AIPlan,
} from "@/lib/planEngine";
import type { StructuredData, Hx } from "@/lib/getAIPlan";

/* ---------------- Rate limit ---------------- */
const limiter = new RateLimiterMemory({ points: 20, duration: 60 });

/* ---------------- PHI scrubber (basic) ---------------- */
function scrub<T>(obj: T): T {
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
  ]);
  return JSON.parse(
    JSON.stringify(obj, (k, v) => (banned.has(k) ? undefined : v))
  ) as T;
}

/* ---------------- House style (no one-liner) ---------------- */
const HOUSE_STYLE = `
Write a chart-ready Assessment & Plan in this exact format:

# <Problem name>
<3–6 sentences of assessment using ONLY the provided facts. Explain, concisely, the most likely etiology with supporting findings (labs, volume status). If any items appear in historyTags, explicitly reference the relevant ones that strengthen or weaken the leading diagnosis—for example: CNS disease/surgery, malignancy, pulmonary disease, or recent medication changes supporting SIADH; recent diuretic use, vomiting, diarrhea, burns/insensible losses, or third spacing supporting hypovolemia. Mention only tags that are present and use your expert understanding of clinical medicine to support your assessment.>
Plan:
- <short, actionable bullet>
- <short, actionable bullet>

Rules:
- Start directly with "# Problem" (no demographics/one-liner).
- Use ONLY <<FACTS>>; do not invent data.
- If hypervolemic + CHF history → “hypervolemic hyponatremia due to heart failure”.
- If hypervolemic + cirrhosis → “…due to cirrhosis”.
- if hyperosmolar hyponatremia due to hyperglycemia →indicate the corrected glucose level and is likely pseudohyponatremia from elevated serum glucose 
- If euvolemic and urine Osm ≥100 and urine Na ≥20 → “euvolemic hyponatremia due to SIADH”.
- For severe neurologic symptoms: include ICU, 3% hypertonic bolus, monitoring cadence, and overcorrection guardrails exactly as provided.
- Avoid duplicate bullets; use hyphen bullets (no numbering).
- Output plain text only.
`.trim();

/* ---------------- StructuredData -> PatientInputs ---------------- */
function toPatientInputs(d: StructuredData): PatientInputs {
  const hx: Partial<Hx> = d.hx ?? {};
  return {
    serumNa: d.measuredNa,
    serumOsm: d.serumOsm ?? null,
    urineOsm: d.urineOsm ?? null,
    urineNa: d.urineNa ?? null,
    glucose: d.glucose ?? null,
    neuroSeverity:
      d.severity === "severe"
        ? "Severe"
        : d.severity === "moderate"
        ? "Moderate"
        : "Mild",
    volumeStatus: d.volumeStatus ?? "uncertain",
    dx: {
      hf: Boolean(d.heartFailureHx ?? hx.chf),
      ef: null,
      cirrhosis: Boolean(d.cirrhosisHx ?? hx.cirrhosisPortalHTN),
      ckd: Boolean(d.ckdHx ?? hx.ckd),
      siadhLikely:
        d.volumeStatus === "euvolemic" &&
        (d.urineOsm ?? 0) >= 100 &&
        (d.urineNa ?? 0) >= 20,
    },
    notableSymptoms: d.symptoms ?? [],
    notes: d.likelyCategory ?? null,
  };
}

/* ---------------- Build historyTags from your hx keys ---------------- */
function buildHistoryTags(
  d: StructuredData & { historyTags?: unknown }
): string[] {
  // If client already sends an array of tags, use it.
  if (
    Array.isArray(d?.historyTags) &&
    d.historyTags.every((x): x is string => typeof x === "string")
  ) {
    return d.historyTags;
  }

  const hx: Partial<Hx> = d.hx ?? {};
  const map: Record<string, string> = {
    chf: "congestive heart failure",
    cirrhosisPortalHTN: "cirrhosis with portal hypertension",
    uncontrolledDM: "uncontrolled diabetes mellitus",
    ckd: "chronic kidney disease",
    adrenalInsufficiency: "adrenal insufficiency",
    hypothyroidism: "hypothyroidism",
    headInjury: "recent head injury",
    cnsSurgery: "recent CNS surgery",
    nephroticSyndrome: "nephrotic syndrome",
    malignancy: "malignancy",
    chronicDiuretics: "recent diuretic use",
    recentMedChanges: "recent medication changes",
    vomiting: "vomiting",
    diarrhea: "diarrhea",
    burnsInsensible: "burns / insensible losses",
    thirdSpacing: "third spacing (pancreatitis/peritonitis)",
  };

  const out = new Set<string>();
  for (const [key, label] of Object.entries(map)) {
    if (hx?.[key as keyof Hx]) out.add(label);
  }

  // Also include legacy flat flags if present.
  if (d?.heartFailureHx) out.add("congestive heart failure");
  if (d?.cirrhosisHx) out.add("cirrhosis with portal hypertension");
  if (d?.ckdHx) out.add("chronic kidney disease");

  return Array.from(out);
}

/* ---------------- Build facts sent to LLM ---------------- */
function buildFactsForLLM(
  p: PatientInputs,
  engineOut: AIPlan,
  historyTags: string[]
) {
  return {
    inputs: {
      serumNa: p.serumNa,
      serumOsm: p.serumOsm ?? null,
      urineOsm: p.urineOsm ?? null,
      urineNa: p.urineNa ?? null,
      glucose: p.glucose ?? null,
      neuroSeverity: p.neuroSeverity,
      volumeStatus: p.volumeStatus,
      dx: p.dx ?? {},
      notableSymptoms: p.notableSymptoms ?? [],
      notes: p.notes ?? null,
      historyTags, // <-- critical: what you selected in "Pertinent Medical History"
    },
    adjudication: engineOut.computed, // severity, etiology, monitoring cadence, etc.
    evidenceBlocks: engineOut.blocks, // guardrails the model must not contradict
  };
}

type APFacts = ReturnType<typeof buildFactsForLLM>;

/* ---------------- OpenAI call ---------------- */
async function callOpenAI_AP({
  facts,
  style,
}: {
  facts: APFacts;
  style: string;
}) {
  const system =
    "You are a meticulous internal medicine physician. Generate an evidence-based Assessment & Plan strictly from the provided facts. Do not invent data.";
  const user = `
<<STYLE>>
${style}
<</STYLE>>

<<FACTS>>
${JSON.stringify(facts, null, 2)}
<</FACTS>>

Write the full Assessment & Plan now.
`.trim();

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

  if (!resp.ok) throw new Error(await resp.text());
  const json = await resp.json();
  const text = json?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("No content from model.");
  return text;
}

/* ---------------- POST handler ---------------- */
export async function POST(req: NextRequest) {
  // rate limit
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  try {
    await limiter.consume(ip);
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // read + scrub
  let body: unknown;
  try {
    body = scrub(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (!isStructuredDataPayload(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const historyTags = buildHistoryTags(body);
    const p = toPatientInputs(body);
    const engineOut = await getAIPlanFromPatientInputs(p);
    const facts = buildFactsForLLM(p, engineOut, historyTags);
    const fullText = await callOpenAI_AP({ facts, style: HOUSE_STYLE });

    return NextResponse.json({ fullText, computed: engineOut.computed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LLM error.";
    // Safe fallback to deterministic text
    return NextResponse.json(
      {
        fullText: "Assessment & Plan\n\n" + message,
        computed: null,
      },
      { status: 200 }
    );
  }
}

function isStructuredDataPayload(
  value: unknown
): value is StructuredData & { historyTags?: unknown } {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { measuredNa?: unknown };
  return typeof candidate.measuredNa === "number" && Number.isFinite(candidate.measuredNa);
}
