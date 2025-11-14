"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import AiPlanPanel from "@/components/AiPlanPanel";
import type {
  Antiplatelet,
  Anticoagulant,
  PreopAIRequest,
  PreopInputState as InputState,
  ProcedureRisk,
  Urgency,
} from "@/types/preop";

// Pre-Op QuickNote — v2.6 (Guided Flow + risk extras + AI)

// ===== Helpers & Logic =====
const rcriRiskTable = (rcri: number): string => {
  if (rcri <= 0) return "~0.4%";
  if (rcri === 1) return "~1.0%";
  if (rcri === 2) return "~2.4%";
  return ">=5.4%";
};

function computeRCRI(r: InputState["rcri"]): number {
  return (
    (r.highRiskSurgery ? 1 : 0) +
    (r.ischemicHD ? 1 : 0) +
    (r.heartFailure ? 1 : 0) +
    (r.cerebrovascular ? 1 : 0) +
    (r.insulinDM ? 1 : 0) +
    (r.creatGt2 ? 1 : 0)
  );
}

function hasActiveCondition(a: InputState["activeConditions"]): boolean {
  return (
    a.unstableAnginaACS ||
    a.recentMI ||
    a.decompHF ||
    a.significantArrhythmia ||
    a.advancedAVBlock ||
    a.severeValve
  );
}

function poorCapacity(f: InputState["functional"]): boolean {
  if (typeof f.daisScore === "number") return f.daisScore <= 34;
  if (typeof f.canClimbTwoFlights === "boolean") return !f.canClimbTwoFlights;
  return false;
}

function antiplateletList(
  aps: Record<Antiplatelet, boolean>
): Antiplatelet[] {
  return (Object.keys(aps) as Antiplatelet[]).filter((k) => aps[k]);
}

const ACTIVE_CONDITION_OPTIONS = [
  ["Unstable angina / ACS", "unstableAnginaACS"],
  ["Recent MI", "recentMI"],
  ["Decompensated HF", "decompHF"],
  ["Significant arrhythmia", "significantArrhythmia"],
  ["Advanced AV block", "advancedAVBlock"],
  ["Severe valve disease (AS/MS)", "severeValve"],
] as const satisfies ReadonlyArray<
  readonly [string, keyof InputState["activeConditions"]]
>;

const RCRI_OPTIONS = [
  ["High-risk surgery", "highRiskSurgery"],
  ["Ischemic heart disease", "ischemicHD"],
  ["Heart failure", "heartFailure"],
  ["Cerebrovascular disease", "cerebrovascular"],
  ["Insulin-treated diabetes", "insulinDM"],
  ["Creatinine greater than 2 mg/dL", "creatGt2"],
] as const satisfies ReadonlyArray<
  readonly [string, keyof InputState["rcri"]]
>;

const EXTRA_FLAG_OPTIONS = [
  ["Bleeding disorder / bleeding risk", "bleedingRisk"],
  ["Infectious risk / immunosuppression", "infectiousRisk"],
  ["Cirrhosis / chronic liver disease", "cirrhosis"],
  ["Alcohol use disorder / risk for withdrawal", "alcoholUse"],
  ["Opioid use disorder / chronic opioids", "opioidUse"],
] as const satisfies ReadonlyArray<
  readonly [string, keyof InputState["extras"]]
>;

function evaluate(inputs: InputState) {
  const rcriScore = computeRCRI(inputs.rcri);
  const active = hasActiveCondition(inputs.activeConditions);
  const poorFunc = poorCapacity(inputs.functional);

  if (inputs.urgency === "Emergency") {
    return {
      decision: "Proceed (Emergency)",
      rationale:
        "Emergency surgery - proceed with best achievable optimization (hemodynamics, airway, bleeding risk) and appropriate monitoring.",
      testing: "No pre-op stress testing; do not delay emergency care.",
    } as const;
  }

  if (active) {
    return {
      decision: "Do not clear - stabilize first",
      rationale:
        "Active cardiac condition present (ACS/unstable angina, recent MI, decomp HF, serious arrhythmia/AV block, or severe valvular disease).",
      testing:
        "Direct workup/treatment of the active condition (e.g., optimize HF, treat ACS, valve assessment). Reassess timing after stabilization.",
    } as const;
  }

  if (inputs.procedureRisk === "Low") {
    return {
      decision: "Proceed",
      rationale: "Low-risk procedure - no further cardiac testing indicated.",
      testing: "No stress test indicated.",
    } as const;
  }

  if (rcriScore <= 1 || !poorFunc) {
    return {
      decision: "Proceed",
      rationale:
        rcriScore <= 1
          ? `RCRI ${rcriScore} (${rcriRiskTable(
              rcriScore
            )}) and/or adequate functional capacity (>=4 METs).`
          : "Adequate functional capacity (>=4 METs).",
      testing: "No routine stress testing; would not change management.",
    } as const;
  }

  return {
    decision: "Consider testing if results change management",
    rationale: `Elevated risk with poor/unknown functional capacity (RCRI ${rcriScore} - ${rcriRiskTable(
      rcriScore
    )}).`,
    testing:
      "Consider pharmacologic stress imaging or TTE only if findings would lead to revascularization, delay, or cancellation.",
  } as const;
}

function buildMedPlan(inputs: InputState) {
  const ap = antiplateletList(inputs.meds.antiplatelets);
  const ac = inputs.meds.anticoagulant;
  const meds: string[] = [];

  if (inputs.meds.betaBlocker)
    meds.push(
      "Continue beta-blocker (avoid de-novo day-of-surgery initiation)."
    );
  else
    meds.push(
      "No home beta-blocker - avoid same-day initiation; start >=7 days pre-op if newly indicated."
    );

  if (inputs.meds.statin)
    meds.push("Continue statin; start if otherwise indicated.");

  if (inputs.meds.sglt2)
    meds.push(
      "Hold SGLT2 inhibitor 3-4 days pre-op to reduce euglycemic DKA risk."
    );

  if (ac && ac !== "none") {
    const acMap: Record<Anticoagulant, string> = {
      none: "",
      warfarin:
        "Warfarin: typically stop 5 days pre-op; consider bridging only for very high thrombotic risk; confirm plan with surgery/anesthesia.",
      apixaban:
        "Apixaban: often hold ~48-72h pre-op (longer if CKD/neuraxial); confirm locally.",
      rivaroxaban:
        "Rivaroxaban: often hold ~48-72h pre-op; confirm locally.",
      dabigatran:
        "Dabigatran: hold 48-96h depending on renal function & bleeding risk; confirm locally.",
      edoxaban:
        "Edoxaban: often hold ~48-72h pre-op; confirm locally.",
    };
    meds.push(acMap[ac]);
  }

  if (ap.length) {
    meds.push(
      "Antiplatelets: if interruption acceptable, typical holds - prasugrel 7d, clopidogrel 5d, ticagrelor 3d; aspirin individualized (confirm with surgery/anesthesia)."
    );
  }

  return meds.join("\n");
}

function composeNote(inputs: InputState) {
  const rcriScore = computeRCRI(inputs.rcri);
  const dec = evaluate(inputs);
  const medPlan = buildMedPlan(inputs);

  const funcTxt =
    typeof inputs.functional.daisScore === "number"
      ? `DASI ${inputs.functional.daisScore} (${
          inputs.functional.daisScore <= 34 ? "poor" : "adequate"
        } capacity)`
      : inputs.functional.canClimbTwoFlights === undefined
      ? "capacity not documented"
      : inputs.functional.canClimbTwoFlights
      ? ">=4 METs (can climb 2 flights)"
      : "<4 METs (cannot climb 2 flights)";

  const activeList = Object.entries(inputs.activeConditions)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");

  const header =
    `# Pre-op cardiopulmonary risk assessment\n` +
    `Procedure risk: ${inputs.procedureRisk}. RCRI = ${rcriScore} (${rcriRiskTable(
      rcriScore
    )}). ` +
    `Functional capacity: ${funcTxt}. ` +
    `Active cardiac conditions: ${activeList ? activeList : "none"}.` +
    (typeof inputs.extras.vocalPennPct === "number"
      ? ` VOCAL-Penn: ${inputs.extras.vocalPennPct.toFixed(
          1
        )}% (30-day mortality).`
      : "") +
    `\n` +
    `Decision: ${dec.decision}. ${dec.rationale} ${dec.testing}`;

  const medSection = medPlan
    ? `\nPlan:\n` +
      medPlan
        .split("\n")
        .map((l) => (l.trim().startsWith("-") ? l : `- ${l}`))
        .join("\n")
    : "";

  const sections: string[] = [];

  if (inputs.extras.bleedingRisk) {
    sections.push(
      `\n# If bleeding disorder or bleeding risk\nPlan:\n` +
        `- Optimize platelets/coagulation; consider heme consult.\n` +
        `- If on antiplatelets or supplements (fish oil, ginkgo): hold 1-2 weeks prior.`
    );
  }

  if (
    inputs.extras.infectiousRisk ||
    inputs.extras.infectiousDx ||
    inputs.extras.onChronicSteroids
  ) {
    const lines: string[] = [];
    if (inputs.extras.infectiousDx)
      lines.push(
        `- Infectious concern: ${inputs.extras.infectiousDx}.`
      );
    if (inputs.extras.onChronicSteroids)
      lines.push(
        "- On chronic steroids: consider peri-op stress-dose steroid plan per endocrinology/anesthesia."
      );
    lines.push(
      "- Ensure appropriate peri-operative antibiotics and glucose control based on suspected/confirmed source."
    );
    sections.push(
      `\n# Infectious disease / immunosuppression\nPlan:\n` +
        lines.join("\n")
    );
  }

  if (inputs.extras.cirrhosis) {
    sections.push(
      `\n# Hx of cirrhosis\nPlan:\n` +
        `- Calculate VOCAL-Penn score and consider hepatology input.`
    );
  }

  if (inputs.extras.alcoholUse || inputs.extras.opioidUse) {
    const lines: string[] = [];
    if (inputs.extras.alcoholUse) {
      lines.push(
        "- Alcohol use disorder/risk for withdrawal: place on CIWA protocol with symptom-triggered benzodiazepines; give thiamine prior to glucose; correct Mg/PO4."
      );
    }
    if (inputs.extras.opioidUse) {
      lines.push(
        "- Opioid use disorder/chronic opioids: continue baseline MAT (e.g., buprenorphine/methadone) per anesthesia/pain; employ multimodal analgesia; anticipate higher opioid needs."
      );
    }
    sections.push(
      `\n# Substance use considerations\nPlan:\n` + lines.join("\n")
    );
  }

  if (inputs.extras.additionalNotes) {
    sections.push(
      `\n# Additional notes\n${inputs.extras.additionalNotes}`
    );
  }

  const tail =
    `\n# Prophylaxis\n` +
    `- Resume DVT prophylaxis when appropriate (per surgeon).\n` +
    `- Delirium precautions.`;

  return [header, medSection, ...sections, tail]
    .filter(Boolean)
    .join("\n")
    .trim();
}

// ===== Small UI primitives =====
const primaryButtonClass =
  "rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-semibold shadow-md transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-1";
const secondaryButtonClass =
  "rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:ring-offset-1";
const fieldInputClass =
  "w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300";

function StepHeader({
  step,
  total,
  title,
  hint,
}: {
  step: number;
  total: number;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
          Step {step} of {total}
        </div>
        <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 text-[10px] font-semibold text-indigo-700 px-3 py-1 shadow-sm">
          Pre-Op QuickNote
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h2>
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
  disabled,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base = "px-3 py-2 rounded-xl border text-sm font-semibold transition focus:outline-none";
  const focus = disabled
    ? ""
    : "focus:ring-2 focus:ring-indigo-200 focus:ring-offset-1";
  const palette = disabled
    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none"
    : active
    ? "bg-indigo-600 text-white border-indigo-700 shadow-md hover:bg-indigo-500"
    : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm";
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`${base} ${focus} ${palette}`}
      title={disabled ? "Controlled by a previous step" : undefined}
    >
      {children}
    </button>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white shadow-[0_18px_45px_-28px_rgba(79,70,229,0.65)] p-6">
      {children}
    </div>
  );
}

function BinaryChipGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="text-sm text-indigo-900 font-medium w-48 shrink-0">{label}</div>
      <div className="flex gap-2">
        <Chip active={value} onClick={() => onChange(true)}>
          Taking
        </Chip>
        <Chip active={!value} onClick={() => onChange(false)}>
          Not taking
        </Chip>
      </div>
    </div>
  );
}

// ===== Main Component (Guided Flow) =====
export default function PreOpQuickNoteDemo() {
  const TOTAL_STEPS = 7;
  const [current, setCurrent] = useState(1);
  const [showExamples, setShowExamples] = useState(false);

  const [state, setState] = useState<InputState>({
    procedureRisk: "Intermediate",
    urgency: "Elective",
    activeConditions: {
      unstableAnginaACS: false,
      recentMI: false,
      decompHF: false,
      significantArrhythmia: false,
      advancedAVBlock: false,
      severeValve: false,
    },
    rcri: {
      highRiskSurgery: false,
      ischemicHD: false,
      heartFailure: false,
      cerebrovascular: false,
      insulinDM: false,
      creatGt2: false,
    },
    functional: { canClimbTwoFlights: true, daisScore: undefined },
    meds: {
      betaBlocker: false,
      statin: true,
      sglt2: false,
      anticoagulant: "none",
      antiplatelets: {
        aspirin: false,
        clopidogrel: false,
        prasugrel: false,
        ticagrelor: false,
      },
    },
    priorRevasc: {},
    labs: {},
    nsqipCpt: "",
    extras: {
      bleedingRisk: false,
      infectiousRisk: false,
      infectiousDx: "",
      onChronicSteroids: false,
      cirrhosis: false,
      alcoholUse: false,
      opioidUse: false,
      additionalNotes: "",
      vocalPennPct: undefined,
    },
  });

  const rcriScore = useMemo(
    () => computeRCRI(state.rcri),
    [state.rcri]
  );
  const decision = useMemo(() => evaluate(state), [state]);
  const note = useMemo(() => composeNote(state), [state]);
  const [aiText, setAiText] = useState<string | null>(null);

  const next = () =>
    setCurrent((c) => Math.min(TOTAL_STEPS, c + 1));
  const back = () => setCurrent((c) => Math.max(1, c - 1));

  const copyNote = async () => {
    try {
      await navigator.clipboard.writeText(aiText ?? note);
      alert("Copied note to clipboard.");
    } catch {
      alert("Copy failed - select and copy manually.");
    }
  };

  const getAIData = useCallback<() => PreopAIRequest>(
    () => ({
      context: "preop",
      meta: {
        procedureRisk: state.procedureRisk,
        urgency: state.urgency,
        rcri: rcriScore,
        rcriBand: rcriRiskTable(rcriScore),
        vocalPennPct: state.extras.vocalPennPct,
      },
      activeConditions: state.activeConditions,
      meds: state.meds,
      functional: state.functional,
      extras: state.extras,
      draft: note,
    }),
    [state, rcriScore, note]
  );

  // Sanity check
  useEffect(() => {
    const tests: Array<[string, boolean]> = [];
    tests.push(["rcriRiskTable(0)", rcriRiskTable(0) === "~0.4%"]);
    const failed = tests.filter(([, pass]) => !pass);
    if (failed.length) {
      console.warn(
        "Pre-Op QuickNote self-tests failed:",
        failed.map(([name]) => name)
      );
    }
  }, []);

  // ===== Screens =====
  const Step1 = (
    <Box>
      <StepHeader
        step={1}
        total={TOTAL_STEPS}
        title="Procedure Risk and Urgency"
        hint="These two choices set the starting branch of the guideline."
      />

      <div className="mb-2 text-sm text-indigo-900 flex items-center gap-2">
        <span className="font-medium">Procedure risk</span>
        <button
          type="button"
          aria-label="Examples"
          title="Click to toggle examples"
          onClick={() => setShowExamples((v) => !v)}
          className="w-6 h-6 rounded-full border border-indigo-200 bg-white text-[11px] font-semibold leading-[22px] text-indigo-600 flex items-center justify-center transition hover:bg-indigo-50 hover:border-indigo-300"
        >
          ?
        </button>
      </div>

      {showExamples && (
        <div className="text-sm text-indigo-900 mb-4 rounded-xl border border-indigo-100 bg-indigo-50/80 p-4 shadow-inner">
          <div className="font-semibold mb-2">
            Examples by category
          </div>
          <div className="mb-1">
            <span className="font-semibold">Low (&lt;1%):</span> cataract,
            superficial dermatologic, endoscopy/colonoscopy, minor dental,
            breast lumpectomy, ambulatory hernia repair.
          </div>
          <div className="mb-1">
            <span className="font-semibold">Intermediate (1–5%):</span>{" "}
            laparoscopic cholecystectomy/appendectomy, most general
            surgery, ortho (non-major spine), urologic (TURP, nephrectomy),
            gynecologic (hysterectomy), ENT, carotid endarterectomy.
          </div>
          <div>
            <span className="font-semibold">High (&gt;5%):</span> major
            vascular (open AAA, aorto-bifemoral), thoracic, major abdominal
            with expected blood loss, transplant, long/complex spine.
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {["Low", "Intermediate", "High"].map((x) => (
          <Chip
            key={x}
            active={state.procedureRisk === x}
            onClick={() => {
              setState((s) => ({
                ...s,
                procedureRisk: x as ProcedureRisk,
                rcri: {
                  ...s.rcri,
                  highRiskSurgery: (x as ProcedureRisk) === "High",
                },
              }));
            }}
          >
            {x}
          </Chip>
        ))}
      </div>

      <div className="mb-2 text-xs text-indigo-700">Urgency</div>
      <div className="flex flex-wrap gap-2">
        {["Elective", "Time-sensitive", "Emergency"].map((x) => (
          <Chip
            key={x}
            active={state.urgency === x}
            onClick={() => {
              setState((s) => ({ ...s, urgency: x as Urgency }));
              next();
            }}
          >
            {x}
          </Chip>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={next}
          className={primaryButtonClass}
        >
          Next
        </button>
      </div>
    </Box>
  );

  const Step2 = (() => {
    const noneActive = Object.values(
      state.activeConditions
    ).every((v) => !v);
    return (
      <Box>
        <StepHeader
          step={2}
          total={TOTAL_STEPS}
          title="Any active cardiac conditions?"
          hint="Any yes ⇒ stabilize before surgery."
        />
        <div className="flex flex-wrap gap-2">
          {ACTIVE_CONDITION_OPTIONS.map(([label, key]) => (
            <Chip
              key={key}
              active={state.activeConditions[key]}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  activeConditions: {
                    ...s.activeConditions,
                    [key]: !s.activeConditions[key],
                  },
                }))
              }
            >
              {label}
            </Chip>
          ))}
          <Chip
            active={noneActive}
            onClick={() =>
              setState((s) => ({
                ...s,
                activeConditions: {
                  unstableAnginaACS: false,
                  recentMI: false,
                  decompHF: false,
                  significantArrhythmia: false,
                  advancedAVBlock: false,
                  severeValve: false,
                },
              }))
            }
          >
            None
          </Chip>
        </div>
        <div className="mt-6 flex justify-between">
          <button
            onClick={back}
            className={secondaryButtonClass}
          >
            Back
          </button>
          <button
            onClick={next}
            className={primaryButtonClass}
          >
            Next
          </button>
        </div>
      </Box>
    );
  })();

  const Step3 = (() => {
    const noneActive = Object.values(state.rcri).every(
      (v) => v === false
    );
    return (
      <Box>
        <StepHeader
          step={3}
          total={TOTAL_STEPS}
          title="RCRI Score"
          hint="Check the factors that apply. High-risk surgery is controlled by Step 1."
        />
        <div className="flex flex-wrap gap-2">
          {RCRI_OPTIONS.map(([label, key]) => (
            <Chip
              key={key}
              active={state.rcri[key]}
              disabled={
                key === "highRiskSurgery" &&
                state.procedureRisk !== "High"
              }
              onClick={() =>
                setState((s) => ({
                  ...s,
                  rcri: {
                    ...s.rcri,
                    [key]: !s.rcri[key],
                  },
                }))
              }
            >
              {label}
            </Chip>
          ))}
          <Chip
            active={noneActive}
            onClick={() =>
              setState((s) => ({
                ...s,
                rcri: {
                  highRiskSurgery: false,
                  ischemicHD: false,
                  heartFailure: false,
                  cerebrovascular: false,
                  insulinDM: false,
                  creatGt2: false,
                },
              }))
            }
          >
            None
          </Chip>
        </div>
        <div className="mt-4 text-xs text-indigo-700">
          Score:{" "}
          <span className="font-semibold">
            {rcriScore}
          </span>{" "}
          ({rcriRiskTable(rcriScore)})
        </div>
        <div className="mt-6 flex justify-between">
          <button
            onClick={back}
            className={secondaryButtonClass}
          >
            Back
          </button>
          <button
            onClick={next}
            className={primaryButtonClass}
          >
            Next
          </button>
        </div>
      </Box>
    );
  })();

  const Step4 = (
    <Box>
      <StepHeader
        step={4}
        total={TOTAL_STEPS}
        title="Functional capacity"
        hint="4 METs or more usually means no further testing."
      />
      <div className="flex flex-wrap gap-2 mb-3">
        <Chip
          active={!!state.functional.canClimbTwoFlights}
          onClick={() => {
            setState((s) => ({
              ...s,
              functional: {
                ...s.functional,
                canClimbTwoFlights: true,
              },
            }));
            next();
          }}
        >
          Can climb 2 flights (4+ METs)
        </Chip>
        <Chip
          active={state.functional.canClimbTwoFlights === false}
          onClick={() =>
            setState((s) => ({
              ...s,
              functional: {
                ...s.functional,
                canClimbTwoFlights: false,
              },
            }))
          }
        >
          {"Cannot climb 2 flights ("}
          <span>&lt;4 METs</span>
          {")"}
        </Chip>
      </div>
      <label className="block mt-2">
        <div className="text-xs text-indigo-700 mb-1">
          DASI score (optional)
        </div>
        <input
          type="number"
          className={fieldInputClass}
          value={
            typeof state.functional.daisScore === "number"
              ? String(state.functional.daisScore)
              : ""
          }
          onChange={(e) =>
            setState((s) => ({
              ...s,
              functional: {
                ...s.functional,
                daisScore: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              },
            }))
          }
          placeholder="e.g., 36"
        />
      </label>
      <div className="mt-6 flex justify-between">
        <button
          onClick={back}
          className={secondaryButtonClass}
        >
          Back
        </button>
        <button
          onClick={next}
          className={primaryButtonClass}
        >
          Next
        </button>
      </div>
    </Box>
  );

  const Step5 = (
    <Box>
      <StepHeader
        step={5}
        total={TOTAL_STEPS}
        title="Peri-op medications"
        hint="Toggle what the patient is actually taking."
      />

      <BinaryChipGroup
        label="Beta-blocker"
        value={state.meds.betaBlocker}
        onChange={(v) =>
          setState((s) => ({
            ...s,
            meds: { ...s.meds, betaBlocker: v },
          }))
        }
      />
      <BinaryChipGroup
        label="Statin"
        value={state.meds.statin}
        onChange={(v) =>
          setState((s) => ({
            ...s,
            meds: { ...s.meds, statin: v },
          }))
        }
      />
      <BinaryChipGroup
        label="SGLT2 inhibitor"
        value={state.meds.sglt2}
        onChange={(v) =>
          setState((s) => ({
            ...s,
            meds: { ...s.meds, sglt2: v },
          }))
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <label className="block">
          <div className="text-xs text-indigo-700 mb-1">
            Anticoagulant
          </div>
          <select
            className={fieldInputClass}
            value={state.meds.anticoagulant}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                meds: {
                  ...s.meds,
                  anticoagulant: e.target.value as Anticoagulant,
                },
              }))
            }
          >
            {[
              "none",
              "warfarin",
              "apixaban",
              "rivaroxaban",
              "dabigatran",
              "edoxaban",
            ].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <div>
          <div className="text-xs text-indigo-700 mb-1">
            Antiplatelets
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                "aspirin",
                "clopidogrel",
                "prasugrel",
                "ticagrelor",
              ] as Antiplatelet[]
            ).map((p) => (
              <Chip
                key={p}
                active={state.meds.antiplatelets[p]}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    meds: {
                      ...s.meds,
                      antiplatelets: {
                        ...s.meds.antiplatelets,
                        [p]: !s.meds.antiplatelets[p],
                      },
                    },
                  }))
                }
              >
                {p}
              </Chip>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-between">
        <button
          onClick={back}
          className={secondaryButtonClass}
        >
          Back
        </button>
        <button
          onClick={next}
          className={primaryButtonClass}
        >
          Next
        </button>
      </div>
    </Box>
  );

  const Step6 = (
    <Box>
      <StepHeader
        step={6}
        total={TOTAL_STEPS}
        title="Additional risk screens"
        hint="Only check what applies — note sections auto-populate."
      />
      <div className="flex flex-wrap gap-2 mb-3">
        {EXTRA_FLAG_OPTIONS.map(([label, key]) => (
          <Chip
            key={key}
            active={state.extras[key]}
            onClick={() =>
              setState((s) => ({
                ...s,
                extras: {
                  ...s.extras,
                  [key]: !s.extras[key],
                },
              }))
            }
          >
            {label}
          </Chip>
        ))}
      </div>

      {/* VOCAL-Penn (manual) & steroids toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Show VOCAL-Penn only if cirrhosis is checked */}
        {state.extras.cirrhosis && (
          <label className="block">
            <div className="text-xs text-indigo-700 mb-1">
              VOCAL-Penn (30-day mortality, %)
            </div>
            <input
              type="number"
              min={0}
              step={0.1}
              className={fieldInputClass}
              placeholder="e.g., 2.7"
              value={state.extras.vocalPennPct ?? ""}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  extras: {
                    ...s.extras,
                    vocalPennPct: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  },
                }))
              }
            />
          </label>
        )}

        <label className="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            className="w-4 h-4 accent-indigo-600"
            checked={state.extras.onChronicSteroids}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                extras: {
                  ...s.extras,
                  onChronicSteroids: e.target.checked,
                },
              }))
            }
          />
          <span className="text-sm text-indigo-900">
            On chronic systemic steroids
          </span>
        </label>
      </div>

      {/* Infectious free-text */}
      <label className="block mt-3">
        <div className="text-xs text-indigo-700 mb-1">
          Infectious disease Dx / concern (optional)
        </div>
        <input
          type="text"
          className={fieldInputClass}
          placeholder="e.g., cellulitis of LLE; recent COVID; chronic osteo on suppressive abx"
          value={state.extras.infectiousDx || ""}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              extras: {
                ...s.extras,
                infectiousDx: e.target.value,
              },
            }))
          }
        />
      </label>

      {/* Additional free-notes */}
      <label className="block mt-3">
        <div className="text-xs text-indigo-700 mb-1">
          Additional notes to include (optional)
        </div>
        <textarea
          className={`${fieldInputClass} min-h-[96px]`}
          rows={3}
          placeholder="Any extra context you want copied into the note..."
          value={state.extras.additionalNotes || ""}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              extras: {
                ...s.extras,
                additionalNotes: e.target.value,
              },
            }))
          }
        />
      </label>

      <div className="mt-6 flex justify-between">
        <button
          onClick={back}
          className={secondaryButtonClass}
        >
          Back
        </button>
        <button
          onClick={next}
          className={primaryButtonClass}
        >
          Next
        </button>
      </div>
    </Box>
  );

  
  const Step7 = (
    <Box>
      <StepHeader
        step={7}
        total={TOTAL_STEPS}
        title="Copy-ready note"
        hint="Click Generate AI Plan, review, then copy into Epic/Cerner."
      />
  
      {/* Big decision banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white px-5 py-4 mb-5 shadow-xl">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-100/90">
          Cardiac clearance decision
        </div>
        <div className="text-xl font-semibold tracking-tight mt-1">
          {decision.decision}
        </div>
        <div className="text-xs mt-1 text-indigo-100/80">
          RCRI {rcriScore} ({rcriRiskTable(rcriScore)})
          {typeof state.extras.vocalPennPct === "number" && (
            <> · VOCAL-Penn {state.extras.vocalPennPct.toFixed(1)}%</>
          )}
        </div>
      </div>

      {/* Single note textbox — shows base note, then AI plan once generated */}
      <textarea
        className="w-full h-[320px] rounded-2xl border border-indigo-200 bg-white/95 p-4 text-sm font-mono text-gray-900 whitespace-pre-wrap shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-200"
        value={aiText ?? note}
        readOnly
      />

      {/* AI Plan panel (no internal textarea; just button + errors) */}
      <div className="mt-6">
        <AiPlanPanel getData={getAIData} onText={setAiText} />
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={back}
          className={secondaryButtonClass}
        >
          Back
        </button>
        <div className="space-x-2">
          <button
            onClick={() => {
              setCurrent(1);
              setAiText(null); // clear AI output when restarting
            }}
            className={secondaryButtonClass}
          >
            Start over
          </button>
          <button
            onClick={copyNote}
            className={primaryButtonClass}
          >
            Copy
          </button>
        </div>
      </div>
  
      <p className="mt-3 text-[11px] text-gray-500">
        Tip: you can fill only what changes the branch; everything else is
        optional.
      </p>
      <p className="mt-2 text-[10px] text-gray-400">
        References: 2024 AHA/ACC perioperative guideline; Modha and Whinney 2022
        (Ann Intern Med); Perioperative Medication Management reference; JAMA
        Review 2022 (PMID 36343344).
      </p>
    </Box>
  );
  

  // Sticky summary dock
  const SummaryDock = (
    <div className="fixed left-0 right-0 bottom-0 z-30 pb-4">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/90 shadow-lg backdrop-blur-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs text-indigo-900">
            <span className="font-semibold mr-2">RCRI {rcriScore}</span>
            <span className="mr-2 text-indigo-800/90">({rcriRiskTable(rcriScore)})</span>
            <span className="text-indigo-700/90">Decision: {decision.decision}</span>
          </div>
          <button
            onClick={() => setCurrent(TOTAL_STEPS)}
            className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
          >
            Jump to note
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white/80 px-4 py-2 text-sm font-semibold text-indigo-700 tracking-tight shadow-sm transition hover:bg-indigo-50 hover:border-indigo-300"
        >
          ← Back to NotoMed.dev
        </Link>
      </div>

      <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Pre-Op QuickNote &amp; Risk Stratifier
        </h1>
        <p className="mt-2 text-base text-gray-600">
          A guided workflow for perioperative risk assessment with copy-ready documentation.
        </p>
        <p className="text-xs text-gray-800 italic mt-2">
          This tool is a clinical aid and does not replace clinical judgement. Verify all recommendations with patient-specific factors.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="space-y-6">
          {current === 1 && Step1}
          {current === 2 && Step2}
          {current === 3 && Step3}
          {current === 4 && Step4}
          {current === 5 && Step5}
          {current === 6 && Step6}
          {current === 7 && Step7}
        </div>
      </main>

      {current >= 3 && SummaryDock}
    </div>
  );
}
