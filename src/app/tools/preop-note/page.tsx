import type { Metadata } from "next";

import PreopNoteClient from "./client-page";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: "AI Powered Pre-op Note Builder & Risk Stratifier",
  },
  description:
    "Generate complete pre-operative assessments with AI-assisted risk stratification, guideline prompts, and copy-ready notes.",
  alternates: {
    canonical: absoluteUrl("/tools/preop-note"),
  },
  openGraph: {
    title: "AI Powered Pre-op Note Builder & Risk Stratifier",
    description:
      "Summarize comorbidities, calculate perioperative risk, and export a polished note in minutes.",
    url: absoluteUrl("/tools/preop-note"),
  },
  twitter: {
    title: "AI Powered Pre-op Note Builder & Risk Stratifier",
    description:
      "Build pre-op notes with structured inputs, RCRI support, and AI-generated recommendations.",
  },
};

export default function PreopNotePage() {
  return <PreopNoteClient />;
}
