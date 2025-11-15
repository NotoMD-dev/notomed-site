import type { Metadata } from "next";

import HyponaCalcClient from "./client-page";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: "Hyponatremia Calculator",
  },
  description:
    "Guided hyponatremia workup with safety guardrails and differential support for inpatient teams.",
  alternates: {
    canonical: absoluteUrl("/tools/hypona-calc"),
  },
  openGraph: {
    title: "Hyponatremia Calculator",
    description:
      "Stepwise evaluation and management helper for low sodium patients, with AI-assisted plan generation.",
    url: absoluteUrl("/tools/hypona-calc"),
  },
  twitter: {
    title: "Hyponatremia Calculator",
    description:
      "Guided thinking for safe hyponatremia management plus AI plan drafting.",
  },
};

export default function HyponaCalcPage() {
  return <HyponaCalcClient />;
}
