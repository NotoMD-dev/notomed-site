// src/app/about/page.tsx
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { aboutMetadata } from "@/lib/seo";

export const metadata: Metadata = aboutMetadata;

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* back button */}
      <div className="mx-auto mb-4 max-w-5xl px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold tracking-tight text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
        >
          ← Back to NotoMed.dev
        </Link>
      </div>

      {/* header */}
      <header className="max-w-5xl mx-auto px-6 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          About NotoMed.dev and its creator
        </h1>
        <p className="mt-2 text-base text-gray-600">
          A collection of physician-built tools meant to reduce cognitive load,
          standardize workflows, and make on-service life a little easier.
        </p>
      </header>

      {/* content */}
      <main className="max-w-5xl mx-auto px-6 pb-12 grid gap-10 md:grid-cols-[1.1fr,0.7fr]">
        {/* left: blurb */}
        <div className="space-y-5">
          <h2 className="text-sm font-semibold tracking-tight text-gray-800">
            Hi, I’m Yasmine! 👋
          </h2>

          <p className="text-sm leading-relaxed text-gray-700">
            I’m a third-year Internal Medicine resident at Cedars-Sinai. I recognized that much of my
            daily work involved recurring, cognitively heavy tasks (e.g. hyponatremia workups, insulin
            management, opioid conversions), yet there were few streamlined, web-based solutions to
            reduce that load.
          </p>

          <p className="text-sm leading-relaxed text-gray-700">
            When I couldn’t find what I needed, I started building my own web applications and sharing
            them, which led to the creation of <span className="font-semibold">notomed.dev</span>.
          </p>

          <p className="text-sm leading-relaxed text-gray-700">
            The goal here is simple: create clinical support tools that make inpatient medicine
            ~10% easier. These tools are meant to be intuitive, evidence-based, and aimed at the common,
            predictable problems that slow us down.
          </p>

          <p className="text-sm leading-relaxed text-gray-700">
            These apps are built for the setting I practice in — adult, hospitalized patients — so they
            may not fit every clinical environment.
          </p>

          <p className="text-sm leading-relaxed text-gray-700">
            <span className="font-semibold">A note on the tech side:</span> I'm a largely self-taught coder/developer 
            who completed a year of CS in college. This website and all tools were pierced together with determination and help
            from LLMs (Gemini, GPT 5.1 and Codex). Each tool took real time to build, so if you find one
            useful, please share it or tell me how to make it better.
          </p>

          <p className="text-sm leading-relaxed text-gray-700">
            <span className="font-semibold">Important:</span> These tools are not meant to, and should not, replace clinical judgement. 
            They are meant to offload the repeatable parts so we can spend more time on the part that
            matters: patient care.
          </p>

          <div className="flex gap-3 flex-wrap">
            <Link
              href="/Yasmine-Abbey-Resume.pdf"
              target="_blank"
              className="inline-flex items-center gap-2 bg-black text-white text-xs px-4 py-2 rounded-sm"
            >
              View résumé
            </Link>

            <Link
              href="mailto:yasmineabbey@gmail.com"
              className="inline-flex items-center gap-2 border border-gray-300 bg-white text-xs px-4 py-2 rounded-sm hover:bg-gray-100"
            >
              Email me
            </Link>
          </div>
        </div>

        {/* right: photo / card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center gap-4">
          <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-100">
            <Image
              src="/picture/yasmine.jpg"
              alt="Photo of Yasmine Abbey"
              width={320}
              height={320}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Yasmine Abbey, MD, MSc</p>
            <p className="text-xs text-gray-500 mt-1">
              Internal medicine • inpatient tooling • AI-assisted builds
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
