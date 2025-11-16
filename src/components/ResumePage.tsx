"use client";

import React, { useState } from "react";

const sections = [
  {
    id: "education",
    title: "Education",
    blurb:
      "UCLA David Geffen School of Medicine (MD), Johns Hopkins (MSc), and Vassar College (BA in Biochemistry).",
  },
  {
    id: "training",
    title: "Medical Training",
    blurb:
      "Internal Medicine Residency at Cedars-Sinai Medical Center, with clinical training across UCLA-affiliated hospitals.",
  },
  {
    id: "research",
    title: "Research & Competitive Awards",
    blurb:
      "Dean's Leaders in Health and Science Fellow, NCI Research Fellow, MD Anderson CPRIT/CURE Scholar, and senior thesis work in oncology and molecular targets.",
  },
  {
    id: "tech",
    title: "Tech Experience",
    blurb:
      "Clinical cofounder and product builder (Serenity), clinical specialist roles at Glass Health and Google, and creator of NotoMed.dev clinical tools.",
  },
  {
    id: "skills",
    title: "Skills & Interests",
    blurb:
      "10+ years of research experience, AI-assisted programming, clinical medicine across diverse systems, scientific and creative writing, and teaching.",
  },
  {
    id: "publications",
    title: "Publications & Ongoing Projects",
    blurb:
      "Peer-reviewed work in Neuropharmacology, Cell Reports Medicine, and Scientific Reports, plus ongoing anti-racism, AI-communication, and clinical tool development projects.",
  },
] as const;

const SectionChevron = ({ open }: { open: boolean }) => (
  <span
    className={`ml-3 inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/60 text-[11px] transition-transform duration-200 ${
      open ? "rotate-90" : ""
    }`}
  >
    ›
  </span>
);

export default function ResumePage() {
  const [openId, setOpenId] = useState<string | null>("education");

  return (
    <div className="relative min-h-screen bg-[#172319] text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.15),_transparent_60%),_linear-gradient(to_right,_rgba(148,163,184,0.14)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(148,163,184,0.14)_1px,_transparent_1px)] bg-[length:100%_100%,80px_80px,80px_80px] opacity-60"
      />

      <main className="relative mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-16 pt-20 sm:px-8 lg:px-10">
        <section className="max-w-3xl space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">
            About the creator
          </p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Resume & training overview
          </h1>
          <p className="text-sm leading-relaxed text-emerald-50/80 sm:text-base">
            A more detailed look at my medical training, research background, and
            technical work building tools like NotoMed.dev. Sections can be
            expanded or collapsed so you can skim what matters most.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,_2fr)_minmax(260px,_1.2fr)]">
          <div className="space-y-3">
            {sections.map((section) => {
              const open = openId === section.id;
              return (
                <article
                  key={section.id}
                  className={`overflow-hidden rounded-xl border border-emerald-900/70 bg-emerald-950/40 backdrop-blur-sm transition-shadow ${
                    open
                      ? "shadow-[0_18px_60px_rgba(0,0,0,0.4)]"
                      : "shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenId((prev) => (prev === section.id ? null : section.id))
                    }
                    className="flex w-full items-center justify-between px-4 py-4 text-left sm:px-5"
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-200/70">
                        {section.title}
                      </p>
                      <p className="mt-1 text-sm text-emerald-50/90">
                        {section.blurb}
                      </p>
                    </div>
                    <SectionChevron open={open} />
                  </button>

                  {open && (
                    <div className="border-t border-emerald-900/60 bg-black/20 px-4 py-4 text-sm leading-relaxed text-emerald-50/90 sm:px-5">
                      {section.id === "education" && (
                        <ul className="space-y-1.5 text-[13px]">
                          <li>
                            <span className="font-semibold">UCLA David Geffen School of Medicine</span>{" — MD (2023)"}
                          </li>
                          <li>
                            <span className="font-semibold">Johns Hopkins University</span>
                            {" — MSc, Biotechnology: Molecular Targets & Drug Discovery (2018)"}
                          </li>
                          <li>
                            <span className="font-semibold">Vassar College</span>
                            {" — BA, Biochemistry (2016)"}
                          </li>
                        </ul>
                      )}

                      {section.id === "training" && (
                        <ul className="space-y-1.5 text-[13px]">
                          <li>
                            <span className="font-semibold">Cedars-Sinai Medical Center</span>
                            {" — Internal Medicine Residency (2023–2026). Adult inpatient focus."}
                          </li>
                          <li>
                            <span className="font-semibold">UCLA David Geffen School of Medicine</span>
                            {" — Medical school training across tertiary and county hospitals (2018–2023)."}
                          </li>
                        </ul>
                      )}

                      {section.id === "research" && (
                        <ul className="space-y-1.5 text-[13px]">
                          <li>
                            UCLA Dean&apos;s Leaders in Health and Science Research Fellow (2021–2022).
                          </li>
                          <li>National Cancer Institute Research Fellowship (2016–2018).</li>
                          <li>MD Anderson Cancer Center CPRIT/CURE Scholar (2015).</li>
                          <li>
                            Senior thesis and undergraduate research in oncology and molecular
                            pharmacology.
                          </li>
                        </ul>
                      )}

                      {section.id === "tech" && (
                        <ul className="space-y-1.5 text-[13px]">
                          <li>
                            <span className="font-semibold">Serenity</span>, Clinical Cofounder
                            {" — 2023–present. Audience’s Choice and Genentech Diversity, Equity and Inclusion awards at the 2023 Nucleate Pitch Competition."}
                          </li>
                          <li>
                            <span className="font-semibold">Glass Health</span>, Clinical Specialist
                            {" — 2023–2024."}
                          </li>
                          <li>
                            <span className="font-semibold">Google Inc.</span>, Medical Specialist
                            {" — 2021–2023. Worked at the intersection of medicine, LLMs, and knowledge tools."}
                          </li>
                          <li>
                            Builder of AI-assisted clinical tools on <span className="font-semibold">NotoMed.dev</span>,
                            focusing on inpatient workflows (hyponatremia, opioids, pre-op risk).
                          </li>
                        </ul>
                      )}

                      {section.id === "skills" && (
                        <ul className="space-y-1.5 text-[13px]">
                          <li>
                            10+ years of biomedical and public health research, with strengths in
                            study design, statistics, and presentation.
                          </li>
                          <li>
                            Comfortable with Python/JavaScript basics, AI-assisted development, and
                            data tools (Excel, SPSS, R).
                          </li>
                          <li>
                            Extensive clinical experience spanning tertiary and county systems;
                            strong interest in immunology, oncology, and general medicine.
                          </li>
                          <li>
                            Scientific and creative writing, editing, and teaching/tutoring across
                            the pre-med curriculum.
                          </li>
                        </ul>
                      )}

                      {section.id === "publications" && (
                        <ul className="space-y-1.5 text-[13px]">
                          <li>
                            Rook, J. M., Hayashi, A., Salinas, D., Abbey, Y. C., et al. (2025). Recent
                            trends and risk factors for chemical and physical restraint of trauma
                            patients during emergency department evaluation and treatment: An
                            institutional study. <span className="italic">Neuropharmacology</span>.{" "}
                            <a
                              href="https://doi.org/10.1016/j.neuropharm.2024.109876"
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-emerald-400/70 underline-offset-2 hover:decoration-emerald-300"
                            >
                              https://doi.org/10.1016/j.neuropharm.2024.109876
                            </a>
                          </li>
                          <li>
                            Senatorov, I. S., Abbey, Y. C., et al. (2024). Castrate-resistant prostate
                            cancer response to taxane is determined by an HNF1-dependent apoptosis
                            resistance circuit. <span className="italic">Cell Reports Medicine</span>, 5(7),
                            101234.{" "}
                            <a
                              href="https://doi.org/10.1016/j.xcrm.2024.101234"
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-emerald-400/70 underline-offset-2 hover:decoration-emerald-300"
                            >
                              https://doi.org/10.1016/j.xcrm.2024.101234
                            </a>
                          </li>
                          <li>
                            Jansson, K. H., Tucker, J. B., Stahl, L. E., Simmons, J. K., Fuller, C., Abbey,
                            Y. C., et al. (2018). High-throughput screens identify HSP90 inhibitors as
                            potent therapeutics that target inter-related growth and survival pathways
                            in advanced prostate cancer. <span className="italic">Scientific Reports</span>, 8,
                            17239.{" "}
                            <a
                              href="https://doi.org/10.1038/s41598-018-35417-0"
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-emerald-400/70 underline-offset-2 hover:decoration-emerald-300"
                            >
                              https://doi.org/10.1038/s41598-018-35417-0
                            </a>
                          </li>
                          <li>
                            <span className="font-semibold">In preparation:</span> Investigating the use of
                            anti-racist learning groups in mitigating racial bias in the UCLA Psychiatry
                            department.
                          </li>
                          <li>
                            <span className="font-semibold">On-going projects:</span> Real-time AI language
                            interpretation to improve communication with patients who have language
                            discordance, and the development of validated AI-powered health tools for
                            clinicians.
                          </li>
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <aside className="mt-2 flex flex-col gap-4 rounded-2xl border border-emerald-900/70 bg-emerald-950/40 p-5 text-sm text-emerald-50/85 shadow-[0_16px_50px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-emerald-500/70 bg-emerald-900/40" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/80">
                  Yasmine C. Abbey, MD, MSc
                </p>
                <p className="mt-1 text-[13px] text-emerald-50/90">
                  Third-year Internal Medicine resident at Cedars-Sinai in Los
                  Angeles, building physician-made clinical tools.
                </p>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed text-emerald-100/75">
              My work lives at the intersection of bedside medicine, clinical
              research, and software. I care about reducing cognitive load for
              clinicians so we can focus on the parts of the job that actually
              require a human.
            </p>

            <div className="mt-1 flex flex-wrap gap-2">
              <a
                href="mailto:Yasmineabbey@gmail.com"
                className="inline-flex items-center rounded-full border border-emerald-400/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90 transition hover:bg-emerald-400 hover:text-[#051109]"
              >
                Email me
              </a>
              <a
                href="https://www.linkedin.com/in/yasmine-cheryl-abbey-503b3197/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-emerald-400/40 bg-black/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/80 transition hover:border-emerald-300 hover:bg-emerald-400/10"
              >
                View LinkedIn
              </a>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
