"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import AiPlanPanel from "@/components/AiPlanPanel";
import type { StructuredData } from "@/lib/getAIPlan";
import {
  TestTube,
  Droplets,
  Brain,
  Stethoscope,
  Calculator,
  ClipboardList,
} from "lucide-react";

/**
 * Hyponatremia Calculator — v4.1
 * Refactored to match opioid tool structure:
 * - top wrapper: back button + header
 * - inner component: actual calculator UI
 *
 * based on your existing file
 */

/* =========================
   CONSTANTS / RANGES
   ========================= */

const REF = {
  serumNa: [136, 145] as const,
  serumOsm: [275, 295] as const,
};

const THRESH = {
  URINE_OSM_DILUTE: 100,
  URINE_NA_LOW: 20,
  URINE_NA_SIADH: 20,
  HYPERGLYCEMIA_FLAG: 300,
  HYPERTONIC_OSM: 295,
  ISO_OSM_LOW: 275,
};

const HYPONATREMIA_CUTOFF = 130;

const RANGES = {
  serumNa: [110, 160],
  serumOsm: [200, 350],
  urineNa: [5, 300],
  urineOsm: [20, 1500],
  bun: [2, 150],
  cr: [0.2, 15],
  urineCr: [1, 500],
  urineUrea: [10, 3000],
  serumGlucose: [30, 1000],
} as const;

const VOL_OPTIONS = ["hypovolemic", "euvolemic", "hypervolemic"] as const;
type VolumeStatus = (typeof VOL_OPTIONS)[number] | undefined;

const SEVERITY_OPTIONS = ["severe", "moderate", "mild"] as const;
type Severity = (typeof SEVERITY_OPTIONS)[number] | undefined;

const titleCase = (s: string) => s.replace(/\b\w/g, (m) => m.toUpperCase());

/* =========================
   HISTORY MODEL
   ========================= */

const INITIAL_HX = {
  chf: false,
  cirrhosisPortalHTN: false,
  uncontrolledDM: false,
  ckd: false,
  adrenalInsufficiency: false,
  hypothyroidism: false,
  headInjury: false,
  cnsSurgery: false,
  nephroticSyndrome: false,
  malignancy: false,
  chronicDiuretics: false,
  recentMedChanges: false,
  vomiting: false,
  diarrhea: false,
  burnsInsensible: false,
  thirdSpacing: false,
};
type History = typeof INITIAL_HX;

const HISTORY_LABELS: ReadonlyArray<readonly [keyof History, string]> = [
  ["chf", "CHF"],
  ["cirrhosisPortalHTN", "Cirrhosis with Portal HTN"],
  ["uncontrolledDM", "Uncontrolled DM"],
  ["ckd", "CKD"],
  ["adrenalInsufficiency", "Adrenal Insufficiency"],
  ["hypothyroidism", "Hypothyroidism"],
  ["headInjury", "Recent Head Injury"],
  ["cnsSurgery", "Recent CNS Surgery"],
  ["nephroticSyndrome", "Nephrotic Syndrome"],
  ["malignancy", "Malignancy"],
  ["chronicDiuretics", "Diuretic use (last 48–72 h)"],
  ["recentMedChanges", "New or Recent Medication Changes"],
  ["vomiting", "Vomiting"],
  ["diarrhea", "Diarrhea"],
  ["burnsInsensible", "Burns / insensible losses"],
  ["thirdSpacing", "Third spacing (pancreatitis/peritonitis)"],
] as const;

/* =========================
   TYPES
   ========================= */

type Sanitized = {
  serumNa?: number;
  serumOsm?: number;
  urineNa?: number;
  urineOsm?: number;
  serumGlucose?: number;
  bun?: number;
  cr?: number;
  urineCr?: number;
  urineUrea?: number;
};

type Assessment = {
  ready: boolean;
  category?: string;
  possibleEtiologies?: string[];
  rationale?: string[];
  treatment?: string[];
  caveats?: string[];
  mixedFlag?: string | null;
  fena?: number;
  feurea?: number;
};

/* =========================
   VALIDATION / SANITIZE
   ========================= */

const labelMap = {
  serumNa: "Serum Na",
  serumOsm: "Serum Osm",
  urineNa: "Urine Na",
  urineOsm: "Urine Osm",
  bun: "BUN",
  cr: "Creatinine",
  urineCr: "Urine creatinine",
  urineUrea: "Urine urea nitrogen",
  serumGlucose: "Serum glucose",
} as const;

function validate(name: keyof typeof RANGES, value: number | undefined): string | null {
  if (value == null) return null;
  const [lo, hi] = RANGES[name];
  if (value < lo || value > hi) {
    const label = labelMap[name] ?? name;
    return `⚠️ ${label} of ${value} is outside typical range (${lo}–${hi}). Please double-check.`;
  }
  return null;
}

function sanitize(name: keyof typeof RANGES, value: number | undefined): number | undefined {
  return validate(name, value) ? undefined : value;
}

/* =========================
   ENGINE HELPERS
   ========================= */

function computeGlucoseCorrectedNa(serumNa?: number, serumGlucose?: number): number | undefined {
  if (serumNa == null || serumGlucose == null) return undefined;
  const delta = Math.max(0, serumGlucose - 100);
  return +(serumNa + 1.6 * (delta / 100)).toFixed(1);
}

function computeFENa(
  urineNa?: number,
  serumNa?: number,
  urineCr?: number,
  cr?: number
): number | undefined {
  if (urineNa == null || serumNa == null || urineCr == null || cr == null) return undefined;
  if (serumNa <= 0 || urineCr <= 0) return undefined;
  return +(((urineNa * cr) / (serumNa * urineCr)) * 100).toFixed(1);
}

function computeFEUrea(
  urineUrea?: number,
  bun?: number,
  urineCr?: number,
  cr?: number,
  onDiuretic?: boolean
): number | undefined {
  if (!onDiuretic) return undefined;
  if (urineUrea == null || bun == null || urineCr == null || cr == null) return undefined;
  if (bun <= 0 || urineCr <= 0) return undefined;
  return +(((urineUrea * cr) / (bun * urineCr)) * 100).toFixed(1);
}

function interpretFENa(v?: number): string | undefined {
  if (v == null) return;
  if (v < 1) return "<1%: prerenal/extrarenal hypovolemia (watch diuretics/CKD).";
  if (v > 2) return ">2%: intrinsic renal (e.g. ATN).";
  return "1–2%: indeterminate.";
}

function interpretFEUrea(v?: number): string | undefined {
  if (v == null) return;
  if (v < 35) return "<35%: prerenal; preferred if on diuretics.";
  if (v > 50) return ">50%: intrinsic renal.";
  return "35–50%: indeterminate.";
}

/* =========================
   RULES ENGINE
   ========================= */

function computeAssessment(
  s: Sanitized,
  hx: History,
  volumeStatus: VolumeStatus,
  opts: {
    glucoseCorrectedNa?: number;
    feurea?: number;
    fena?: number;
    severity?: "severe" | "moderate" | "mild";
  } = {}
): Assessment {
  const { glucoseCorrectedNa, feurea, fena, severity } = opts;

  // 1. bail out if Na not actually low
  if (s.serumNa != null && s.serumNa > HYPONATREMIA_CUTOFF) {
    return {
      ready: true,
      category: `Serum sodium not in treatment range (> ${HYPONATREMIA_CUTOFF} mEq/L)`,
      rationale: [
        `Serum Na ${s.serumNa} mEq/L is > ${HYPONATREMIA_CUTOFF}.`,
        "This pathway is intended for true hyponatremia.",
      ],
      treatment: [],
      possibleEtiologies: [],
      caveats: [],
      mixedFlag: null,
    };
  }

  // need core labs + volume
  if ([s.serumNa, s.serumOsm, s.urineNa, s.urineOsm, volumeStatus].some((v) => v == null)) {
    return { ready: false };
  }

  const rationale: string[] = [];
  const caveats: string[] = [];
  const treatment: string[] = [];
  const possibleEtiologies = new Set<string>();
  let category = "";

  rationale.push(`Serum Na ${s.serumNa} mEq/L (ref ${REF.serumNa[0]}–${REF.serumNa[1]}).`);

  // tonicity branch
  if ((s.serumOsm as number) >= THRESH.HYPERTONIC_OSM) {
    category = "Hyperosmolar hyponatremia";
    rationale.push(
      `Serum Osm ${s.serumOsm} mOsm/kg is high → hypertonic causes (hyperglycemia, mannitol).`
    );
    if (
      hx.uncontrolledDM &&
      s.serumGlucose != null &&
      s.serumGlucose >= THRESH.HYPERGLYCEMIA_FLAG
    ) {
      rationale.push("Uncontrolled DM + hyperglycemia supports glucose-mediated water shift.");
    }
    treatment.push("Treat the underlying hypertonic driver; avoid rapid shifts in Na.");
  } else if (
    (s.serumOsm as number) >= THRESH.ISO_OSM_LOW &&
    (s.serumOsm as number) < THRESH.HYPERTONIC_OSM
  ) {
    category = "Iso-osmolar hyponatremia (pseudohyponatremia)";
    rationale.push("Serum Osm is normal → think lab artifact, hyperTG, hyperproteinemia.");
    treatment.push("Confirm with direct ISE or evaluate lipids/proteins.");
  } else {
    // hypo-osmolar pathway
    rationale.push(`Serum Osm ${s.serumOsm} mOsm/kg is low → hypo-osmolar category.`);
    const vol = volumeStatus;

    // diluted urine
    if ((s.urineOsm as number) < THRESH.URINE_OSM_DILUTE) {
      category = `${titleCase(String(volumeStatus))} hyponatremia`;
      rationale.push(`Urine Osm ${s.urineOsm} < 100 → dilute urine (polydipsia / low solute).`);
      possibleEtiologies.add("Primary polydipsia");
      possibleEtiologies.add("Low-solute diet (beer potomania / tea & toast)");
      treatment.push("Increase solute intake; restrict free water.");
    } else {
      // concentrated urine
      rationale.push(`Urine Osm ${s.urineOsm} ≥ 100 → concentrating appropriately.`);
      const onDiuretic = !!hx.chronicDiuretics;

      if (vol === "hypovolemic") {
        category = "Hypovolemic hyponatremia";

        if (onDiuretic) {
          rationale.push("On diuretic → UNa less reliable → prefer FEUrea.");
          if (feurea != null && feurea < 35) {
            possibleEtiologies.add("Extrarenal losses / prerenal");
            rationale.push("FEUrea <35% → prerenal/hypovolemic.");
          } else if (feurea != null && feurea > 50) {
            possibleEtiologies.add("Intrinsic renal salt loss");
          } else if (feurea == null) {
            caveats.push("Provide urine urea + urine Cr to calculate FEUrea (diuretic on board).");
          }
        } else {
          // not on diuretic → use UNa
          if ((s.urineNa as number) < THRESH.URINE_NA_LOW) {
            possibleEtiologies.add("Extrarenal losses (vomiting, diarrhea, burns, third spacing)");
            treatment.push("Isotonic saline to restore volume; treat ongoing losses.");
          } else {
            possibleEtiologies.add("Renal salt loss / diuretics / mineralocorticoid deficiency");
            treatment.push("Stop diuretics if possible; give isotonic saline; monitor Na closely.");
          }
        }
      }

      if (vol === "euvolemic") {
        category = "Euvolemic hyponatremia";
        const siadhish = onDiuretic
          ? feurea != null
            ? feurea > 50
            : false
          : (s.urineNa as number) >= THRESH.URINE_NA_SIADH;

        if (siadhish) {
          possibleEtiologies.add("SIADH / endocrine mimics");
          if (hx.malignancy) possibleEtiologies.add("Paraneoplastic SIADH");
          if (hx.hypothyroidism) possibleEtiologies.add("Hypothyroidism");
          if (hx.adrenalInsufficiency) possibleEtiologies.add("Adrenal insufficiency");
          treatment.push(
            "Fluid restriction 800–1000 mL/day; review meds; screen TSH and AM cortisol; consider salt tabs/loop."
          );
        } else {
          possibleEtiologies.add("Low-solute intake vs early SIADH");
          treatment.push("Fluid restriction while evaluating; increase solute if low.");
        }
      }

      if (vol === "hypervolemic") {
        category = "Hypervolemic hyponatremia";
        if (hx.chf) possibleEtiologies.add("CHF");
        if (hx.cirrhosisPortalHTN) possibleEtiologies.add("Cirrhosis / portal HTN");
        if (hx.nephroticSyndrome) possibleEtiologies.add("Nephrotic syndrome");
        if (hx.ckd) possibleEtiologies.add("CKD / renal failure");

        treatment.push("Fluid + sodium restriction; loop diuretics as appropriate;");
        if (hx.cirrhosisPortalHTN)
          treatment.push("Manage ascites (paracentesis + albumin) / hepatology referral.");
      }
    }
  }

  // caveats
  if (
    s.serumGlucose != null &&
    s.serumGlucose > 100 &&
    glucoseCorrectedNa &&
    glucoseCorrectedNa !== s.serumNa
  ) {
    caveats.push(
      `Glucose-corrected Na ≈ ${glucoseCorrectedNa} mEq/L (≈ +1.6 per 100 mg/dL over 100).`
    );
  }
  if (hx.recentMedChanges) {
    caveats.push("Recent medication changes can precipitate SIADH — review meds.");
  }
  caveats.push(
    "Avoid rapid correction: generally aim 4–6 or 6-8 mEq/L increase in 24h (≤6 if high ODS risk)."
  );

  // severity layering
  if (severity === "severe") {
    treatment.unshift("Immediate 3% NaCl bolus per local protocol for severe symptoms.");
    treatment.unshift("Consider higher level of care / ICU monitoring.");
  } else if (severity === "moderate") {
    treatment.push("Consider hypertonic saline if worsening; frequent Na checks.");
  }

  // mixed flags
  let mixedFlag: string | null = null;
  if (
    volumeStatus === "hypervolemic" &&
    !hx.chronicDiuretics &&
    !hx.ckd &&
    (s.urineNa as number) >= 20
  ) {
    mixedFlag =
      "Hypervolemia but UNa ≥ 20 without diuretics/CKD — consider renal failure or mixed disorder.";
  }

  return {
    ready: true,
    category,
    possibleEtiologies: Array.from(possibleEtiologies),
    rationale,
    treatment,
    caveats,
    mixedFlag,
    fena,
    feurea,
  };
}

/* =========================
   UI PRIMITIVES
   ========================= */

   function Section({
    title,
    icon,
    children,
  }: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
  }) {
    return (
      <div className="rounded-2xl border border-[#d7e0d4] bg-white shadow-sm mb-6 overflow-hidden">
        {/* taller top bar */}
        <div className="flex items-center gap-3 px-5 py-4 bg-[#eef2ed]/70 border-b border-[#d7e0d4]">
          {icon ? <span className="text-[#355a45] text-lg">{icon}</span> : null}
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        </div>
        {/* body with a little extra top space */}
        <div className="p-5 pt-6">{children}</div>
      </div>
    );
  }
  
  
  
function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string | null;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold mb-1 text-gray-500">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  error,
}: {
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  error?: string | null;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${
        error ? "border-red-400 ring-red-200" : "border-gray-300 focus:ring-[#c7d8c7]"
      }`}
    />
  );
}

function InputWithUnit({ children, unit }: { children: React.ReactNode; unit?: string }) {
  return (
    <div className="relative">
      {children}
      {unit ? (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-md border bg-[#eef2ed] text-[#2f4c3d]">
          {unit}
        </span>
      ) : null}
    </div>
  );
}

function ChipToggle({
  checked,
  onChange,
  children,
  style = "default",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
  style?: "default" | Exclude<Severity, undefined>;
}) {
  const styles = {
    default: {
      on: "bg-[#3f6b53] text-white shadow-md border-[#2f4c3d]",
      off: "bg-white text-gray-800 hover:bg-[#eef2ed] border-gray-300",
    },
    severe: {
      on: "bg-red-600 text-white shadow-md border-red-700",
      off: "bg-white text-gray-800 hover:bg-red-50 border-gray-300",
    },
    moderate: {
      on: "bg-amber-600 text-white shadow-md border-amber-700",
      off: "bg-white text-gray-800 hover:bg-amber-50 border-gray-300",
    },
    mild: {
      on: "bg-green-600 text-white shadow-md border-green-700",
      off: "bg-white text-gray-800 hover:bg-green-50 border-gray-300",
    },
  } as const;

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`px-3 py-1.5 rounded-full border text-sm transition font-medium whitespace-nowrap ${
        checked ? styles[style].on : styles[style].off
      }`}
    >
      {children}
    </button>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warn" | "info" | "success";
}) {
  const tones = {
    neutral: "bg-gray-100 text-gray-700 border-gray-300",
    warn: "bg-amber-100 text-amber-800 border-amber-300",
    info: "bg-blue-100 text-blue-800 border-blue-300",
    success: "bg-green-100 text-green-800 border-green-300",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/* =========================
   MAIN APP CONTENT
   ========================= */

function HyponatremiaAppContent() {
  const [serumNa, setSerumNa] = useState<number | undefined>(undefined);
  const [serumOsm, setSerumOsm] = useState<number | undefined>(undefined);
  const [urineNa, setUrineNa] = useState<number | undefined>(undefined);
  const [urineOsm, setUrineOsm] = useState<number | undefined>(undefined);
  const [serumGlucose, setSerumGlucose] = useState<number | undefined>(undefined);
  const [bun, setBun] = useState<number | undefined>(undefined);
  const [cr, setCr] = useState<number | undefined>(undefined);
  const [urineCr, setUrineCr] = useState<number | undefined>(undefined);
  const [urineUrea, setUrineUrea] = useState<number | undefined>(undefined);
  const [volumeStatus, setVolumeStatus] = useState<VolumeStatus>(undefined);
  const [severity, setSeverity] = useState<Severity>(undefined);
  const [hx, setHx] = useState<History>({ ...INITIAL_HX });

  const sanitized = useMemo<Sanitized>(
    () => ({
      serumNa: sanitize("serumNa", serumNa),
      serumOsm: sanitize("serumOsm", serumOsm),
      urineNa: sanitize("urineNa", urineNa),
      urineOsm: sanitize("urineOsm", urineOsm),
      serumGlucose: sanitize("serumGlucose", serumGlucose),
      bun: sanitize("bun", bun),
      cr: sanitize("cr", cr),
      urineCr: sanitize("urineCr", urineCr),
      urineUrea: sanitize("urineUrea", urineUrea),
    }),
    [
      serumNa,
      serumOsm,
      urineNa,
      urineOsm,
      serumGlucose,
      bun,
      cr,
      urineCr,
      urineUrea,
    ]
  );

  const inputsReady =
    [sanitized.serumNa, sanitized.serumOsm, sanitized.urineNa, sanitized.urineOsm].every((v) => v != null) &&
    volumeStatus != null &&
    severity != null;

  const glucoseCorrectedNa = useMemo(
    () => computeGlucoseCorrectedNa(sanitized.serumNa, sanitized.serumGlucose),
    [sanitized.serumNa, sanitized.serumGlucose]
  );

  const fena = useMemo(
    () => computeFENa(sanitized.urineNa, sanitized.serumNa, sanitized.urineCr, sanitized.cr),
    [sanitized.urineNa, sanitized.serumNa, sanitized.urineCr, sanitized.cr]
  );

  const feurea = useMemo(
    () =>
      computeFEUrea(
        sanitized.urineUrea,
        sanitized.bun,
        sanitized.urineCr,
        sanitized.cr,
        hx.chronicDiuretics
      ),
    [sanitized.urineUrea, sanitized.bun, sanitized.urineCr, sanitized.cr, hx.chronicDiuretics]
  );

  const algoDisabled =
    sanitized.serumNa != null && (sanitized.serumNa as number) > HYPONATREMIA_CUTOFF;

  const assessment = useMemo(
    () =>
      computeAssessment(sanitized, hx, volumeStatus, {
        glucoseCorrectedNa,
        fena,
        feurea,
        severity,
      }),
    [
      sanitized,
      hx,
      volumeStatus,
      severity,
      glucoseCorrectedNa,
      fena,
      feurea,
    ]
  );

  const resetAll = () => {
    setSerumNa(undefined);
    setSerumOsm(undefined);
    setSerumGlucose(undefined);
    setBun(undefined);
    setCr(undefined);
    setUrineNa(undefined);
    setUrineOsm(undefined);
    setUrineCr(undefined);
    setUrineUrea(undefined);
    setVolumeStatus(undefined);
    setSeverity(undefined);
    setHx({ ...INITIAL_HX });
  };

  const structuredData: StructuredData = {
    measuredNa: typeof sanitized.serumNa === "number" ? sanitized.serumNa : NaN,
    correctedNa: glucoseCorrectedNa,
    serumOsm: sanitized.serumOsm,
    glucose: sanitized.serumGlucose,
    bun: sanitized.bun,
    creatinine: sanitized.cr,
    urineOsm: sanitized.urineOsm,
    urineNa: sanitized.urineNa,
    volumeStatus: volumeStatus ?? undefined,
    diuretics: !!hx.chronicDiuretics,
    heartFailureHx: !!hx.chf,
    cirrhosisHx: !!hx.cirrhosisPortalHTN,
    ckdHx: !!hx.ckd,
    symptoms: [],
    onset: undefined,
    likelyCategory: assessment.ready ? assessment.category : undefined,
    caveats: assessment.caveats ?? [],
    severity: severity ?? "mild",
    hx: { ...hx },
  };

  return (
    <main className="max-w-5xl mx-auto px-6 pb-10">
      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <div className="md:col-span-1">
          <Section title="Required Labs" icon={<TestTube />}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Serum Na" error={validate("serumNa", serumNa)}>
                <InputWithUnit unit="mEq/L">
                  <NumberInput value={serumNa} onChange={setSerumNa} error={validate("serumNa", serumNa)} />
                </InputWithUnit>
                {algoDisabled && (
                    <div className="mt-1">
                      <Badge tone="warn">
                        Algorithm disabled (Na &gt; {HYPONATREMIA_CUTOFF})
                      </Badge>
                    </div>
                  )}
              </Field>
              <Field label="Serum Osm" error={validate("serumOsm", serumOsm)}>
                <InputWithUnit unit="mOsm/kg">
                  <NumberInput value={serumOsm} onChange={setSerumOsm} error={validate("serumOsm", serumOsm)} />
                </InputWithUnit>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Urine Na" error={validate("urineNa", urineNa)}>
                <InputWithUnit unit="mEq/L">
                  <NumberInput value={urineNa} onChange={setUrineNa} error={validate("urineNa", urineNa)} />
                </InputWithUnit>
              </Field>
              <Field label="Urine Osm" error={validate("urineOsm", urineOsm)}>
                <InputWithUnit unit="mOsm/kg">
                  <NumberInput value={urineOsm} onChange={setUrineOsm} error={validate("urineOsm", urineOsm)} />
                </InputWithUnit>
              </Field>
            </div>

            <Field label="Serum glucose" error={validate("serumGlucose", serumGlucose)}>
              <InputWithUnit unit="mg/dL">
                <NumberInput
                  value={serumGlucose}
                  onChange={setSerumGlucose}
                  error={validate("serumGlucose", serumGlucose)}
                />
              </InputWithUnit>
              {serumGlucose != null && serumNa != null && serumGlucose > 100 && (
                <p className="text-xs text-gray-600 mt-1">
                  Glucose-corrected Na (approx):{" "}
                  <b>
                    {(() => {
                      const delta = Math.max(0, serumGlucose - 100);
                      const corrected = +(serumNa + 1.6 * (delta / 100)).toFixed(1);
                      return isFinite(corrected) ? corrected : "—";
                    })()}
                  </b>{" "}
                  mEq/L
                </p>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="BUN" error={validate("bun", bun)}>
                <InputWithUnit unit="mg/dL">
                  <NumberInput value={bun} onChange={setBun} error={validate("bun", bun)} />
                </InputWithUnit>
              </Field>
              <Field label="Creatinine" error={validate("cr", cr)}>
                <InputWithUnit unit="mg/dL">
                  <NumberInput value={cr} onChange={setCr} error={validate("cr", cr)} />
                </InputWithUnit>
              </Field>
            </div>
          </Section>

          <Section title="Select Volume Status" icon={<Droplets />}>
            <div className="flex flex-wrap gap-2 mb-3">
              {VOL_OPTIONS.map((v) => (
                <ChipToggle
                  key={v}
                  checked={volumeStatus === v}
                  onChange={(val) => setVolumeStatus(val ? v : undefined)}
                >
                  {titleCase(v)}
                </ChipToggle>
              ))}
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <b>Hypovolemia</b>: tachycardia/hypotension, ↓ turgor, dry mucosa, flat neck veins.
              </p>
              <p>
                <b>Hypervolemia</b>: edema/ascites, JVD, crackles.
              </p>
            </div>
          </Section>

          <Section title="Neurologic Symptoms (Severity)" icon={<Brain />}>
            <div className="flex flex-wrap gap-2 mb-3">
              {SEVERITY_OPTIONS.map((v) => (
                <ChipToggle
                  key={v}
                  checked={severity === v}
                  onChange={(val) => setSeverity(val ? v : undefined)}
                  style={v}
                >
                  {v === "severe"
                    ? "Severe (seizure/coma/AMS)"
                    : v === "moderate"
                    ? "Moderate (HA, lethargy, dizziness)"
                    : "Mild / asymptomatic"}
                </ChipToggle>
              ))}
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <b>Severe</b>: seizures, coma, obtundation, severe confusion.
              </p>
              <p>
                <b>Moderate</b>: HA, lethargy, dizziness.
              </p>
              <p>
                <b>Mild</b>: none of the above.
              </p>
            </div>
          </Section>

          <Section title="Select Pertinent Medical History" icon={<Stethoscope />}>
            <div className="flex flex-wrap gap-2 text-sm">
              {HISTORY_LABELS.map(([key, label]) => (
                <ChipToggle
                  key={key}
                  checked={hx[key]}
                  onChange={(val) => setHx((prev) => ({ ...prev, [key]: val }))}
                >
                  {label}
                </ChipToggle>
              ))}
            </div>
          </Section>

          <Section title="Optional: Renal Indices (FENa / FEUrea)" icon={<Calculator />}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Urine creatinine" error={validate("urineCr", urineCr)}>
                <InputWithUnit unit="mg/dL">
                  <NumberInput value={urineCr} onChange={setUrineCr} error={validate("urineCr", urineCr)} />
                </InputWithUnit>
              </Field>

              {hx.chronicDiuretics && (
                <Field label="Urine urea nitrogen" error={validate("urineUrea", urineUrea)}>
                  <InputWithUnit unit="mg/dL">
                    <NumberInput value={urineUrea} onChange={setUrineUrea} error={validate("urineUrea", urineUrea)} />
                  </InputWithUnit>
                </Field>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              FENa auto-calculates when inputs are present. With diuretics, FEUrea is often more
              reliable.
            </p>
          </Section>

          <div className="flex gap-2">
            <button
              onClick={resetAll}
              className="px-4 py-2 rounded-lg border bg-white text-gray-800 hover:bg-[#eef2ed] hover:border-[#9eb39f] transition shadow-sm"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="md:col-span-1 md:sticky md:top-24 h-fit">
          {inputsReady ? (
            <>
              <Section title="Results: Diagnosis & Management" icon={<ClipboardList />}>
                {algoDisabled && (
                  <div className="mb-3">
                    <Badge tone="warn">Algorithm disabled (Na &gt; {HYPONATREMIA_CUTOFF})</Badge>
                  </div>
                )}

                {assessment.mixedFlag && (
                  <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 text-amber-800 text-sm p-3">
                    <span className="font-bold">Atypical Pattern:</span> {assessment.mixedFlag}
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                    Likely Diagnosis
                  </div>
                  <div className="text-xl font-bold text-[#2f4c3d] mt-1">{assessment.category}</div>
                </div>

                {assessment.possibleEtiologies?.length ? (
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Possible Etiologies
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {assessment.possibleEtiologies.map((e, i) => (
                        <span
                          key={i}
                          className="inline-block text-sm rounded-full px-3 py-1 bg-gray-100 border text-gray-800"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {assessment.rationale?.length ? (
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Reasoning
                    </div>
                    <ol className="list-decimal pl-6 mt-1 text-sm space-y-1 text-gray-700">
                      {assessment.rationale.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {(assessment.fena != null || assessment.feurea != null) && (
                  <div className="mb-4 border-t pt-3">
                    <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Renal Indices (Calculated)
                    </div>
                    {assessment.fena != null && (
                      <p className="text-sm mt-1 text-gray-700">
                        FENa ≈ <b className="text-[#2f4c3d]">{assessment.fena}%</b> —{" "}
                        {interpretFENa(assessment.fena)}
                      </p>
                    )}
                    {assessment.feurea != null && (
                      <p className="text-sm mt-1 text-gray-700">
                        FEUrea ≈ <b className="text-[#2f4c3d]">{assessment.feurea}%</b> —{" "}
                        {interpretFEUrea(assessment.feurea)}
                      </p>
                    )}
                  </div>
                )}

                {assessment.treatment?.length ? (
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Management &amp; Workup
                    </div>
                    <ul className="list-disc pl-5 mt-1 text-sm space-y-1 text-gray-700">
                      {assessment.treatment.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {assessment.caveats?.length ? (
                  <div className="mb-2">
                    <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                      Caveats
                    </div>
                    <ul className="list-disc pl-5 mt-1 text-sm space-y-1 text-gray-700">
                      {assessment.caveats.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
                  Reference: AAFP Hyponatremia algorithm —{" "}
                  <a
                    href="https://www.aafp.org/pubs/afp/issues/2015/0915/p430b/jcr:content/root/aafp-article-primary-content-container/aafp_article_main_par/aafp_figure.enlarge.html"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-[#355a45] hover:text-[#1f362c]"
                  >
                    view figure
                  </a>
                  .
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  This tool is a clinical aid and not a substitute for clinical judgment.
                </p>
              </Section>

              <AiPlanPanel getData={() => structuredData} />
            </>
          ) : (
            <Section title="Results" icon={<Brain />}>
              <div className="text-sm text-gray-700">
                Select <b>Volume Status</b> and <b>Neurologic symptoms (severity)</b> to view results.
              </div>
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}

/* =========================
   OUTER WRAPPER (matches opioid)
   ========================= */

export default function HyponatremiaPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* BACK BUTTON */}
      <div className="mx-auto mb-4 max-w-5xl px-6 pt-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-xl border border-[#c7d2c5] bg-[#050505] px-4 py-2 text-sm font-semibold tracking-tight text-white shadow-sm transition hover:border-[#9eb39f] hover:bg-[#171717]"
        >
          ← Back to Tools
        </Link>
      </div>

      {/* HEADER */}
      <header className="mx-auto mb-8 max-w-5xl px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Hyponatremia Calculator — v4.1
        </h1>
        <p className="mt-2 text-base text-gray-600">
          A guided clinical tool for evaluating low sodium with safety guardrails.
        </p>
        <p className="mt-2 text-xs italic text-gray-800">
          This tool does not replace clinical judgement and is meant to assist in decision-making.
          Always verify calculations and consider patient-specific factors.
        </p>
      </header>

      <HyponatremiaAppContent />
    </div>
  );
}
  
