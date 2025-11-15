import type { Metadata } from "next";

import ToolsDirectoryClient from "./client-page";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: "Clinical Tools Directory",
  },
  description:
    "Browse physician-built calculators and AI workflows for inpatient medicine, including opioid conversions, hyponatremia guidance, and pre-op planning.",
  alternates: {
    canonical: absoluteUrl("/tools"),
  },
  openGraph: {
    title: "Clinical Tools Directory",
    description:
      "Explore opioid, electrolyte, and perioperative helpers designed for hospital medicine teams.",
    url: absoluteUrl("/tools"),
  },
  twitter: {
    title: "Clinical Tools Directory",
    description:
      "Find evidence-minded calculators and AI assistants for inpatient workflows.",
  },
};

export default function ToolsDirectoryPage() {
  return <ToolsDirectoryClient />;
}
