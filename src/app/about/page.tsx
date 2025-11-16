// Restyled about page to Olive V3 layout and card styling
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { aboutMetadata } from "@/lib/seo";

import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = aboutMetadata;

export default function AboutPage() {
  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#7a897b] bg-[#435447] px-4 py-2 text-sm font-medium text-[#f0e5d7] transition-colors hover:border-[#f0a46c] hover:text-[#f3b083]"
          >
            ← Back to NotoMed.dev
          </Link>
        </div>

        <header className="mb-10 space-y-3 text-center sm:text-left">
          <h1 className="text-3xl font-semibold text-[#f9f6ef] sm:text-4xl">
            About NotoMed.dev and its creator
          </h1>
          <p className="mx-auto max-w-2xl text-base text-[#efe7d7] md:text-lg sm:mx-0">
            A collection of physician-built tools meant to reduce cognitive load, standardize workflows, and make on-service life a little easier.
          </p>
        </header>

        <main className="grid gap-10 md:grid-cols-[1.1fr,0.7fr] lg:grid-cols-[1.3fr,0.8fr]">
          <div className="space-y-5 text-base leading-relaxed text-[#f4eee3] md:text-lg">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a89f8f]">
              Hi, I’m Yasmine! 👋
            </h2>

            <p>
              I’m a third-year Internal Medicine Physician (pgy-3). I recognized that much of my daily work involved recurring, cognitively heavy tasks (e.g. hyponatremia workups, insulin management, opioid conversions), yet there were few streamlined, web-based solutions to reduce that load.
            </p>

            <p>
              When I couldn’t find what I needed, I started building my own web applications and sharing them, which led to the creation of <span className="font-semibold text-[#f9f6ef]">notomed.dev</span>.
            </p>

            <p>
              The goal here is simple: create clinical support tools that make inpatient medicine ~10% easier. These tools are meant to be intuitive, evidence-based, and aimed at the common, predictable problems that slow us down.
            </p>

            <p>
              These apps are built for the setting I practice in — adult, hospitalized patients — so they may not fit every clinical environment.
            </p>

            <p>
              <span className="font-semibold text-[#f9f6ef]">A note on the tech side:</span> I&apos;m a largely self-taught coder/developer who completed a year of CS in college. This website and all tools were pieced together with determination and help from LLMs (Gemini, GPT 5.1 and Codex). Each tool took real time to build, so if you find one useful, please share it or tell me how to make it better.
            </p>

            <p>
              <span className="font-semibold text-[#f9f6ef]">Important:</span> These tools are not meant to, and should not, replace clinical judgement. They are meant to offload the repeatable parts so we can spend more time on the part that matters: patient care.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/Yasmine-Abbey-Resume.pdf"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-md bg-[#d27e58] px-4 py-2 text-xs font-medium text-[#221813] transition-colors hover:bg-[#e29a6c]"
              >
                View résumé
              </Link>

              <Link
                href="mailto:yasmineabbey@gmail.com"
                className="inline-flex items-center gap-2 rounded-md border border-[#7a897b] bg-[#435447] px-4 py-2 text-xs font-medium text-[#f0e5d7] transition-colors hover:border-[#f0a46c] hover:text-[#f3b083]"
              >
                Email me
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#7a897b] bg-gradient-to-br from-[#3f5143] via-[#475b4c] to-[#506656] p-6 text-center shadow-[0_22px_70px_rgba(0,0,0,0.7)]">
            <div className="h-36 w-36 overflow-hidden rounded-full border border-[#7a897b] bg-[#3b4c40] sm:h-40 sm:w-40">
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
              <p className="text-sm font-semibold text-[#f9f6ef]">Yasmine Abbey, MD, MSc</p>
              <p className="mt-1 text-xs text-[#d0c8b9]">
                Internal medicine • inpatient tooling • AI-assisted builds
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
