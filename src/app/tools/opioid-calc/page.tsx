import type { Metadata } from "next";

import OpioidCalcClient from "./client-page";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: "Opioid Conversion & Regimen Builder",
  },
  description:
    "Create safe inpatient opioid regimens with automatic oral morphine equivalents, taper guidance, and PRN suggestions.",
  alternates: {
    canonical: absoluteUrl("/tools/opioid-calc"),
  },
  openGraph: {
    title: "Opioid Conversion & Regimen Builder",
    description:
      "Streamline opioid rotations with dose safeguards, PRN calculators, and conversion workflows for the inpatient setting.",
    url: absoluteUrl("/tools/opioid-calc"),
  },
  twitter: {
    title: "Opioid Conversion & Regimen Builder",
    description:
      "Build complete inpatient opioid plans with evidence-informed guardrails and conversions.",
  },
};

export default function OpioidCalcPage() {
  return <OpioidCalcClient />;
}
