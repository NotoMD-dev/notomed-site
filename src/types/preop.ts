export type ProcedureRisk = "Low" | "Intermediate" | "High";
export type Urgency = "Elective" | "Time-sensitive" | "Emergency";

export type Anticoagulant =
  | "none"
  | "warfarin"
  | "apixaban"
  | "rivaroxaban"
  | "dabigatran"
  | "edoxaban";

export type Antiplatelet =
  | "aspirin"
  | "clopidogrel"
  | "prasugrel"
  | "ticagrelor";

export interface PreopActiveConditions {
  unstableAnginaACS: boolean;
  recentMI: boolean;
  decompHF: boolean;
  significantArrhythmia: boolean;
  advancedAVBlock: boolean;
  severeValve: boolean;
}

export interface PreopRCRI {
  highRiskSurgery: boolean;
  ischemicHD: boolean;
  heartFailure: boolean;
  cerebrovascular: boolean;
  insulinDM: boolean;
  creatGt2: boolean;
}

export interface PreopFunctional {
  daisScore?: number;
  canClimbTwoFlights?: boolean;
}

export interface PreopMeds {
  betaBlocker: boolean;
  statin: boolean;
  sglt2: boolean;
  anticoagulant: Anticoagulant;
  antiplatelets: Record<Antiplatelet, boolean>;
}

export interface PreopPriorRevasc {
  pciDate?: string;
  cabgDate?: string;
}

export interface PreopLabs {
  creatinine?: string;
  hgba1c?: string;
  ecgDate?: string;
  troponin?: string;
  bnp?: string;
}

export interface PreopExtras {
  bleedingRisk: boolean;
  infectiousRisk: boolean;
  infectiousDx?: string;
  onChronicSteroids: boolean;
  cirrhosis: boolean;
  alcoholUse: boolean;
  opioidUse: boolean;
  additionalNotes?: string;
  vocalPennPct?: number;
}

export interface PreopInputState {
  procedureRisk: ProcedureRisk;
  urgency: Urgency;
  activeConditions: PreopActiveConditions;
  rcri: PreopRCRI;
  functional: PreopFunctional;
  meds: PreopMeds;
  priorRevasc: PreopPriorRevasc;
  labs: PreopLabs;
  nsqipCpt?: string;
  extras: PreopExtras;
}

export interface PreopAIMeta {
  procedureRisk: ProcedureRisk;
  urgency: Urgency;
  rcri: number;
  rcriBand: string;
  vocalPennPct?: number;
}

export interface PreopAIRequest {
  context: "preop";
  meta: PreopAIMeta;
  activeConditions: PreopActiveConditions;
  meds: PreopMeds;
  functional: PreopFunctional;
  extras: PreopExtras;
  draft: string;
}
