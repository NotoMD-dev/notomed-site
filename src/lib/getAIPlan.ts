// /lib/getAIPlan.ts
import { getAIPlanFromPatientInputs, type AIPlan, type PatientInputs } from "@/lib/planEngine"; 
// ↑ Adjust this import path if your engine lives elsewhere


export type Hx = {
  chf: boolean;
  cirrhosisPortalHTN: boolean;
  uncontrolledDM: boolean;
  ckd: boolean;
  adrenalInsufficiency: boolean;
  hypothyroidism: boolean;
  headInjury: boolean;
  cnsSurgery: boolean;
  nephroticSyndrome: boolean;
  malignancy: boolean;
  chronicDiuretics: boolean;
  recentMedChanges: boolean;
  vomiting: boolean;
  diarrhea: boolean;
  burnsInsensible: boolean;
  thirdSpacing: boolean;
};

export type StructuredData = {
  measuredNa: number;
  correctedNa?: number;
  serumOsm?: number;
  glucose?: number;
  bun?: number;
  creatinine?: number;
  urineOsm?: number;
  urineNa?: number;
  volumeStatus?: "hypovolemic" | "euvolemic" | "hypervolemic";
  diuretics?: boolean;
  heartFailureHx?: boolean;
  cirrhosisHx?: boolean;
  ckdHx?: boolean;
  symptoms?: string[];
  onset?: "acute_48h" | "subacute" | "chronic";
  likelyCategory?: string;
  caveats?: string[];
  severity?: "severe" | "moderate" | "mild";

  // 🔹 NEW: send the chips you collect on the page
  hx?: Hx;
};


/* ---------------- Build facts sent to LLM ---------------- */
function buildFactsForLLM(p: PatientInputs, engineOut: AIPlan) {
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
    },
    adjudication: {
      severity: engineOut.computed.severity,
      phase: engineOut.computed.phase,
      etiologyBucket: engineOut.computed.etiologyBucket,
      bmpFrequency: engineOut.computed.bmpFrequency,
      diuresisGoal: engineOut.computed.diuresisGoal,
      fluidRestriction: engineOut.computed.fluidRestriction,
      holdDiureticsReason: engineOut.computed.holdDiureticsReason ?? null,
    },
    evidenceBlocks: engineOut.blocks,
  };
}

type FactsForLLM = ReturnType<typeof buildFactsForLLM>;

/* ---------------- House style (your format) ---------------- */
const HOUSE_STYLE_V1 = `
Write a chart-ready Assessment & Plan using this exact format:

# <Problem name>
<3–6 sentences of clinical reasoning. Explain likely etiology, supporting findings, and key differentials using only the provided facts.>
Plan:
- <short, actionable bullet>
- <short, actionable bullet>

Guidelines:
- Skip demographics or one-liners. Start directly with "# Problem".
- Use strong clinical reasoning grounded in the provided lab data, volume status, and comorbidities.
- Integrate evidence-based logic: when to use hypertonic saline, when to diurese, when to restrict fluids, etc.
- If CHF + hypervolemia present → "hypervolemic hyponatremia due to heart failure".
- If cirrhosis + hypervolemia present → "hypervolemic hyponatremia due to cirrhosis".
- If euvolemic + SIADH pattern → "euvolemic hyponatremia due to SIADH".
- For severe neuro symptoms → include ICU admission, hypertonic saline bolus, and overcorrection guardrails.
- Avoid repetition; group related issues.
- Always end each problem with “Plan:” in bullet format (no numbering).
- Output plain text only (no JSON, no markdown code blocks).
`.trim();

/* ---------------- OpenAI writer ---------------- */
export type LLMWriter = (args: { facts: FactsForLLM; style: string }) => Promise<string>;

export async function writeAPWithOpenAI({
  facts,
  style,
}: {
  facts: FactsForLLM;
  style: string;
}): Promise<string> {
  const system = `You are an expert internal medicine physician writing evidence-based, concise Assessment & Plans. Follow the style and safety rules strictly.`;
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
      temperature: Number(process.env.AI_TEMPERATURE ?? 0.25),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text.slice(0, 500));
  }

  const json = await resp.json();
  const text = json?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("No output from LLM");
  return text;
}

/* ---------------- Convert StructuredData → PatientInputs ---------------- */
function toPatientInputs(data: StructuredData): PatientInputs {
  return {
    serumNa: data.measuredNa,
    serumOsm: data.serumOsm ?? null,
    urineOsm: data.urineOsm ?? null,
    urineNa: data.urineNa ?? null,
    glucose: data.glucose ?? null,
    neuroSeverity:
      data.severity === "severe"
        ? "Severe"
        : data.severity === "moderate"
        ? "Moderate"
        : "Mild",
    volumeStatus: data.volumeStatus ?? "uncertain",
    dx: {
      hf: !!data.heartFailureHx,
      ef: null,
      cirrhosis: !!data.cirrhosisHx,
      ckd: !!data.ckdHx,
      siadhLikely:
        data.volumeStatus === "euvolemic" &&
        (data.urineOsm ?? 0) >= 100 &&
        (data.urineNa ?? 0) >= 20,
    },
    notableSymptoms: data.symptoms ?? [],
    notes: data.likelyCategory,
  };
}

/* ---------------- Main adapter ---------------- */
export async function getAIPlan(
  data: StructuredData,
  opts?: { llmWriter?: LLMWriter }
): Promise<AIPlan & { fullText: string }> {
  // Step 1: deterministic safety engine
  const p = toPatientInputs(data);
  const engineOut = await getAIPlanFromPatientInputs(p);

  // Step 2: if LLM provided, have it write A/P in your format
  let fullText = `${engineOut.assessment}\n\n${engineOut.planText}`;
  if (opts?.llmWriter) {
    const facts = buildFactsForLLM(p, engineOut);
    try {
      fullText = await opts.llmWriter({ facts, style: HOUSE_STYLE_V1 });
    } catch (error) {
      console.warn("LLM writer failed; fallback to deterministic:", error);
    }
  }

  // Step 3: return both for UI
  return { ...engineOut, fullText };
}
