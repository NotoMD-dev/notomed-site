import type { Metadata } from "next";

import NoteSummarizerClientPage from "./client-page";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: "AI Note Summarizer for De-identified Clinical Notes",
  },
  description:
    "Summarize de-identified inpatient notes into structured briefs, highlight key problems, and explore grounded answers for rounding and handoffs.",
  keywords: [
    "clinical note summarizer",
    "AI clinical documentation",
    "inpatient rounding tool",
    "de-identified notes",
    "medical note summary",
    "note review assistant",
  ],
  alternates: {
    canonical: absoluteUrl("/tools/note-summarizer"),
  },
  openGraph: {
    title: "AI Note Summarizer for De-identified Clinical Notes",
    description:
      "Turn de-identified inpatient notes into structured summaries with key problems, timelines, and follow-ups to speed rounds.",
    url: absoluteUrl("/tools/note-summarizer"),
  },
  twitter: {
    title: "AI Note Summarizer for De-identified Clinical Notes",
    description:
      "Generate structured summaries from de-identified inpatient notes and ask grounded follow-up questions for faster reviews.",
  },
};

export default function NoteSummarizerPage() {
  return <NoteSummarizerClientPage />;
}
