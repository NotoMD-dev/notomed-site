// src/lib/planEngine.ts

// ---------- Types ----------
export type NeuroSeverity = "Severe" | "Moderate" | "Mild";
export type VolumeStatus = "hypovolemic" | "euvolemic" | "hypervolemic" | "uncertain";

export type PatientInputs = {
  serumNa: number;
  serumOsm?: number | null;
  urineOsm?: number | null;
  urineNa?: number | null;
  glucose?: number | null;
  neuroSeverity: NeuroSeverity;
  volumeStatus: VolumeStatus;
  dx?: {
    hf?: boolean;
    ef?: number | null;
    cirrhosis?: boolean;
    ckd?: boolean;
    siadhLikely?: boolean;
  };
  notableSymptoms?: string[];
  notes?: string | null;
};

type SeverityKey = "severe_symptomatic" | "moderate" | "mild_asymptomatic";
type PhaseKey = "acute_neuro_correction" | "stabilization" | "maintenance";
type EtiologyKey =
  | "hypervolemic_HF"
  | "hypervolemic_cirrhosis"
  | "euvolemic_SIADH"
  | "hypovolemic"
  | "mixed_unclear";

export type AIPlan = {
  assessment: string;
  planText: string;
  blocks: { title: string; bullets: string[] }[];
  computed: {
    severity: SeverityKey;
    phase: PhaseKey;
    etiologyBucket: EtiologyKey;
    bmpFrequency: string;
    diuresisGoal: string;
    fluidRestriction: string | null;
    holdDiureticsReason?: string | null;
  };
};

// ---------- Adjudication ----------
function adjudicateSeverity(p: PatientInputs): SeverityKey {
  if (p.neuroSeverity === "Severe") return "severe_symptomatic";
  if (p.serumNa < 125 || p.neuroSeverity === "Moderate") return "moderate";
  return "mild_asymptomatic";
}

function adjudicatePhase(p: PatientInputs, sev: SeverityKey): PhaseKey {
  if (sev === "severe_symptomatic") return "acute_neuro_correction";
  if (p.serumNa < 128) return "stabilization";
  return "maintenance";
}

function adjudicateEtiology(p: PatientInputs): EtiologyKey {
  // Prefer HF when hypervolemic + CHF history (no EF required)
  if (p.volumeStatus === "hypervolemic" && p?.dx?.hf) return "hypervolemic_HF";
  if (p.volumeStatus === "hypervolemic" && p?.dx?.cirrhosis) return "hypervolemic_cirrhosis";
  if (p.volumeStatus === "euvolemic" && p?.dx?.siadhLikely) return "euvolemic_SIADH";
  if (p.volumeStatus === "hypovolemic") return "hypovolemic";
  return "mixed_unclear";
}

// ---------- Deterministic defaults ----------
function computeBMPFreq(sev: SeverityKey): string {
  if (sev === "severe_symptomatic") return "q2h initially, then q4–6h when stable";
  if (sev === "moderate") return "q4–6h";
  return "q12–24h";
}

function computeFluidRestriction(
  _p: PatientInputs,
  sev: SeverityKey,
  et: EtiologyKey
): string | null {
  if (sev === "severe_symptomatic") return "≤1 L/day after initial correction";
  if (et.startsWith("hypervolemic") || et === "euvolemic_SIADH") return "≤1 L/day";
  return null;
}

function computeDiuresisGoal(
  _p: PatientInputs,
  sev: SeverityKey,
  et: EtiologyKey
): string {
  if (et.startsWith("hypervolemic")) {
    if (sev === "severe_symptomatic")
      return "defer until Na ≥124–125 and neurologic status improves";
    return "net –1 to –2 L/day";
  }
  return "not applicable";
}

// ---------- Public API (VALUE export!) ----------
export async function getAIPlanFromPatientInputs(p: PatientInputs): Promise<AIPlan> {
  const severity = adjudicateSeverity(p);
  const phase = adjudicatePhase(p, severity);
  const etiologyBucket = adjudicateEtiology(p);
  const bmpFrequency = computeBMPFreq(severity);
  const fluidRestriction = computeFluidRestriction(p, severity, etiologyBucket);
  const diuresisGoal = computeDiuresisGoal(p, severity, etiologyBucket);
  const holdDiureticsReason =
    severity === "severe_symptomatic" && etiologyBucket.startsWith("hypervolemic")
      ? "Hold loop diuretics during active neuro correction; reassess when Na ≥124–125 and symptoms improve."
      : null;

  const assessment =
    `Hyponatremia (${p.serumNa} mEq/L)` +
    (p.serumOsm != null ? `, serum Osm ${p.serumOsm} mOsm/kg` : "") +
    (p.urineOsm != null ? `, urine Osm ${p.urineOsm} mOsm/kg` : "") +
    ` with ` +
    (severity === "severe_symptomatic"
      ? "severe neurologic symptoms."
      : severity === "moderate"
      ? "moderate symptoms."
      : "mild/asymptomatic presentation.") +
    ` Etiology: ${etiologyBucket.replace(/_/g, " ")}.`;

  const bullets: string[] = [
    `Trend serum sodium ${bmpFrequency}; avoid correction >8–10 mEq/L in 24 h.`,
  ];

  if (etiologyBucket.startsWith("hypervolemic")) {
    bullets.push(
      "Fluid restriction as indicated; sodium restriction <2 g/day.",
      severity === "severe_symptomatic"
        ? "Defer loop diuretics until neurologic status improves and Na ≥124–125."
        : "IV loop diuretic; titrate to urine output and symptoms.",
    );
  } else if (etiologyBucket === "euvolemic_SIADH") {
    bullets.push("Fluid restriction ≤1 L/day; remove offending agents; treat underlying cause.");
  } else if (etiologyBucket === "hypovolemic") {
    bullets.push("Isotonic saline (0.9% NaCl) to restore intravascular volume; hold diuretics.");
  }

  const planText = ["Plan:", ...bullets.map(b => `- ${b}`)].join("\n");

  return {
    assessment,
    planText,
    blocks: [{ title: "Base", bullets }],
    computed: {
      severity,
      phase,
      etiologyBucket,
      bmpFrequency,
      diuresisGoal,
      fluidRestriction,
      holdDiureticsReason,
    },
  };
}
