import type { Metadata } from "next";
import Script from "next/script";

import ResumePage from "@/components/ResumePage";
import SiteHeader from "@/components/SiteHeader";
import { resumeMetadata, siteConfig } from "@/lib/seo";

export const metadata: Metadata = resumeMetadata;

const resumeJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name: "Yasmine Abbey, MD, MSc Resume",
  url: `${siteConfig.url}/resume`,
  description:
    "Explore the education, medical training, research awards, and clinical tool building experience of Yasmine Abbey, MD, MSc.",
  mainEntity: {
    "@type": "Person",
    name: "Yasmine Abbey, MD, MSc",
    jobTitle: "Internal Medicine Resident & Clinical Tool Builder",
    worksFor: {
      "@type": "Organization",
      name: "NotoMed.dev",
      url: siteConfig.url,
    },
    alumniOf: [
      "Cedars-Sinai Medical Center",
      "UCLA David Geffen School of Medicine",
      "Johns Hopkins University",
      "Vassar College",
    ],
    sameAs: [
      "https://www.linkedin.com/in/yasmine-cheryl-abbey-503b3197/",
      "https://twitter.com/yasmineabbey",
    ],
    knowsAbout: [
      "inpatient medicine",
      "clinical research",
      "AI-assisted clinical tools",
      "medical education",
    ],
  },
} as const;

export default function ResumeRoutePage() {
  return (
    <div className="relative z-10 min-h-screen">
      <Script
        id="resume-structured-data"
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {JSON.stringify(resumeJsonLd)}
      </Script>
      <SiteHeader />
      <ResumePage />
    </div>
  );
}
