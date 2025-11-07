// src/app/about/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* back button */}
      <div className="max-w-5xl mx-auto px-6 pt-6 mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-gray-300 bg-white/80 px-4 py-2 text-sm font-medium tracking-tight hover:bg-gray-100 transition"
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
          A small, physician-built collection of inpatient tools meant to reduce cognitive load,
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
          Like most physicians, I spend a lot of time on a computer — charting, documenting, reviewing. 
          I also found myself manually re-doing the same clinical calculations. 
          Out of frustration, I started building tiny web apps (with help from AI/LLMs) to make those repetitive pieces easier.
          </p>
          
          <p className="text-sm leading-relaxed text-gray-700">
          I’m NOT a software engineer. Just a very determined physician who is interested in making medicine less burdenson for clinicians. So, I started notomed.dev.
          </p> 

          <p className="text-sm leading-relaxed text-gray-700">
          Here I’ll post small, evidence-informed tools that make inpatient medicine smoother: guided calculators, regimen builders, and “don’t make me think” flows for common problems. 
          Everything is built after hours, mostly in React/Next.js, with AI assisting.
          </p> 

          <p className="text-sm leading-relaxed text-gray-700">
          The goal isn’t to replace clinical judgment. It’s to speed up the predictable, non-creative parts so we can spend more time on the part that matters: taking care of patients.
          </p>

          <div className="flex gap-3 flex-wrap">
            {/* resume link – put your PDF in /public */}
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
          {/* put your photo in /public/me.jpg and change the src below */}
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
