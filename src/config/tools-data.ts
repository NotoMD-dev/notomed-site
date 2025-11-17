import { CONFIG } from "./notomed-config";

export type ToolCategory = "Analgesia" | "Electrolytes" | "Peri-op" | "Endocrine";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  path?: string | null;
  category: ToolCategory;
  createdAt: string;
  lastUpdated: string;
}

export const toolsData: ToolDefinition[] = [
  {
    id: "opioid-tool",
    name: "Inpatient Opioid Regimen Builder",
    description: "Build a custom inpatient opiate regimen with safety checks.",
    path: CONFIG.opioidToolPath,
    category: "Analgesia",
    createdAt: "2023-08-15",
    lastUpdated: "2025-11-10",
  },
  {
    id: "hyponatremia-tool",
    name: "Hyponatremia Calculator",
    description: "Guided thinking for low sodium with safety in mind.",
    path: CONFIG.hyponatremiaToolPath,
    category: "Electrolytes",
    createdAt: "2023-06-01",
    lastUpdated: "2025-11-05",
  },
  {
    id: "preop-tool",
    name: "AI-powered Pre-op Risk Stratifier",
    description: "Simple pre-op risk write-up you can paste into the EHR.",
    path: CONFIG.preopToolPath,
    category: "Peri-op",
    createdAt: "2025-11-12",
    lastUpdated: "2025-11-16",
  },
  {
    id: "insulin-tool",
    name: "Insulin Titration Helper (Beta)",
    description: "Basal/bolus calculators with guardrails.",
    path: null,
    category: "Endocrine",
    createdAt: "2024-05-01",
    lastUpdated: "2025-11-01",
  },
];
