// Restyled about page to Olive V3 layout and card styling
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import type { Metadata } from "next";
import { aboutMetadata, siteConfig } from "@/lib/seo";

import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = aboutMetadata;

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About NotoMed.dev",
  url: `${siteConfig.url}/about`,
  description:
    "Learn about NotoMed.dev, a physician-built collection of AI-assisted inpatient medicine tools by Yasmine Abbey, MD, MSc.",
  mainEntity: {
    "@type": "Person",
    name: "Yasmine Abbey, MD, MSc",
    jobTitle: "Internal Medicine Resident & Clinical Tool Builder",
    alumniOf: [
      "UCLA David Geffen School of Medicine",
      "Johns Hopkins University",
      "Vassar College",
    ],
    worksFor: {
      "@type": "Organization",
      name: "NotoMed.dev",
      url: siteConfig.url,
    },
    sameAs: [
      "https://www.linkedin.com/in/yasmine-cheryl-abbey-503b3197/",
      "https://twitter.com/yasmineabbey",
    ],
    knowsAbout: [
      "clinical decision support",
      "inpatient medicine",
      "AI-assisted medical tools",
    ],
  },
} as const;

export default function AboutPage() {
  return (
    <div className="relative z-10 min-h-screen">
      <Script
        id="about-structured-data"
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {JSON.stringify(aboutJsonLd)}
      </Script>
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[#050505] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[color:var(--accent)] hover:bg-[#111]"
          >
            ← Back to NotoMed.dev
          </Link>
        </div>

        <header className="mb-10 space-y-3 text-center sm:text-left">
          <h1 className="text-2xl font-semibold text-heading sm:text-3xl">
            About NotoMed.dev and its creator
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-body md:text-base sm:mx-0">
            A collection of physician-built tools meant to reduce cognitive load, standardize workflows, and make on-service life a little easier.
          </p>
        </header>

        <main className="grid gap-10 md:grid-cols-[1.1fr,0.7fr] lg:grid-cols-[1.3fr,0.8fr]">
          <div className="space-y-5 text-sm leading-relaxed text-body md:text-base">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-strong">
              Hi, I’m Yasmine! 👋
            </h2>

            <p>
              I’m a third-year Internal Medicine Physician (pgy-3). I recognized that much of my daily work involved recurring, cognitively heavy tasks (e.g. hyponatremia workups, insulin management, opioid conversions), yet there were few streamlined, web-based solutions to reduce that load.
            </p>

            <p>
              When I couldn’t find what I needed, I started building my own web applications and sharing them, which led to the creation of <span className="font-semibold text-accent">notomed.dev</span>.
            </p>

            <p>
              The goal here is simple: create clinical support tools that make inpatient medicine ~10% easier. These tools are meant to be intuitive, evidence-based, and aimed at the common, predictable problems that slow us down.
            </p>

            <p>
              These apps are built for the setting I practice in — adult, hospitalized patients — so they may not fit every clinical environment.
            </p>

            <p>
              <span className="font-semibold text-accent">A note on the tech side:</span> I&apos;m a largely self-taught coder/developer who completed a year of CS in college. This website and all tools were pieced together with determination and help from LLMs (Gemini, GPT 5.1 and Codex). Each tool took real time to build, so if you find one useful, please share it or tell me how to make it better.
            </p>

            <p>
              <span className="font-semibold text-accent">Important:</span> These tools are not meant to, and should not, replace clinical judgement. They are meant to offload the repeatable parts so we can spend more time on the part that matters: patient care.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/resume"
                className="inline-flex items-center gap-2 rounded-md bg-[color:var(--accent)] px-5 py-2.5 text-[0.94rem] font-medium text-[color:var(--neutral-text)] transition-colors hover:bg-[color:var(--accent-hover)]"
              >
                View résumé
              </Link>

              <Link
                href="mailto:yasmineabbey@gmail.com"
                className="inline-flex items-center gap-2 rounded-md border border-[color:var(--card-border)] bg-[color:var(--pill-bg)] px-5 py-2.5 text-[0.94rem] font-medium text-[color:var(--pill-text)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                Email me
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-2xl card-surface p-6 text-center shadow-[0_22px_70px_rgba(0,0,0,0.7)]">
            <div className="h-36 w-36 overflow-hidden rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-muted)] sm:h-40 sm:w-40">
              <Image
                src="/picture/yasmine.jpg"
                alt="Photo of Yasmine Abbey"
                width={320}
                height={320}
                sizes="(max-width: 640px) 10rem, 13rem"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-heading">Yasmine Abbey, MD, MSc</p>
              <p className="mt-1 text-xs text-body">
                Internal medicine • inpatient tooling • AI-assisted builds
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
