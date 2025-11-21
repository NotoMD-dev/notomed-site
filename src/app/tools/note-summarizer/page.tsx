import type { Metadata } from "next";

import NoteSummarizerClientPage from "./client-page";
import { absoluteUrl } from "@/lib/seo";

const pageTitle = "Note Summarizer for De-identified Clinical Notes";
const pageDescription =
  "Summarize de-identified inpatient notes into structured highlights, timelines, and Q&A to speed rounds and handoffs.";

export const metadata: Metadata = {
  title: {
    absolute: pageTitle,
  },
  description: pageDescription,
  alternates: {
    canonical: absoluteUrl("/tools/note-summarizer"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/tools/note-summarizer"),
  },
  twitter: {
    title: pageTitle,
    description:
      "AI reader for de-identified inpatient notes with structured summaries, timelines, and follow-up questions.",
  },
};

export default function NoteSummarizerPage() {
  return <NoteSummarizerClientPage />;
}
