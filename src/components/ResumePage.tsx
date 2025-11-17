"use client";

import Link from "next/link";
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
    className={`ml-3 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--accent)] text-[11.25px] text-[color:var(--accent)] transition-transform duration-200 ${
      open ? "rotate-90" : ""
    }`}
  >
    ›
  </span>
);

export default function ResumePage() {
  const [openId, setOpenId] = useState<string | null>("education");

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-20 pt-16 sm:px-6 lg:px-8">
      <section className="max-w-3xl space-y-4">
        <p className="text-[12.375px] uppercase tracking-[0.35em] text-muted-strong">
          About the creator
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[2.109375rem] font-semibold leading-tight text-heading sm:text-[2.53125rem]">
            Resume & training overview
          </h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[color:var(--pill-bg)]/80 px-4 py-2 text-[12.375px] font-semibold uppercase tracking-[0.18em] text-heading transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
          >
            <span aria-hidden="true">←</span> Back to NotoMed.dev
          </Link>
        </div>
        <p className="text-[0.984375rem] leading-relaxed text-body sm:text-[1.125rem]">
          A more detailed look at my medical training, research background, and tech
          experience.
          <span className="mt-2 block">Sections can be expanded or collapsed.</span>
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,_2fr)_minmax(260px,_1.1fr)]">
        <div className="space-y-3">
          {sections.map((section) => {
            const open = openId === section.id;
            return (
              <article
                key={section.id}
                className={`overflow-hidden rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-muted)]/60 backdrop-blur-sm transition-shadow duration-200 ${
                  open
                    ? "shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
                    : "shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
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
                    <p className="text-[12.375px] uppercase tracking-[0.28em] text-muted-strong">
                      {section.title}
                    </p>
                    <p className="mt-1 text-[0.984375rem] text-body">{section.blurb}</p>
                  </div>
                  <SectionChevron open={open} />
                </button>

                {open && (
                  <div className="border-t border-[color:var(--card-outline)] bg-[color:var(--input-bg)]/60 px-4 py-4 text-[0.984375rem] leading-relaxed text-body sm:px-5">
                      {section.id === "education" && (
                        <ul className="space-y-1.5 text-[14.625px]">
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
                        <ul className="space-y-1.5 text-[14.625px]">
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
                        <ul className="space-y-1.5 text-[14.625px]">
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
                        <ul className="space-y-1.5 text-[14.625px]">
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
                        <ul className="space-y-1.5 text-[14.625px]">
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
                        <ul className="space-y-4 text-[14.625px]">
                          <li>
                            Rook, J. M., Hayashi, A., Salinas, D., <span className="font-semibold text-heading">Abbey, Y. C.</span>, et al.
                            (2025). Recent trends and risk factors for chemical and physical restraint of trauma patients during emergency
                            department evaluation and treatment: An institutional study. <span className="italic">Neuropharmacology</span>.{" "}
                            <a
                              href="https://doi.org/10.1016/j.neuropharm.2024.109876"
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-[color:var(--accent)]/70 underline-offset-2 hover:decoration-[color:var(--accent)]"
                            >
                              https://doi.org/10.1016/j.neuropharm.2024.109876
                            </a>
                          </li>
                          <li>
                            Senatorov, I. S., <span className="font-semibold text-heading">Abbey, Y. C.</span>, et al. (2024). Castrate-resistant prostate cancer response
                            to taxane is determined by an HNF1-dependent apoptosis resistance circuit. <span className="italic">Cell Reports Medicine</span>, 5(7), 101234.{" "}
                            <a
                              href="https://doi.org/10.1016/j.xcrm.2024.101234"
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-[color:var(--accent)]/70 underline-offset-2 hover:decoration-[color:var(--accent)]"
                            >
                              https://doi.org/10.1016/j.xcrm.2024.101234
                            </a>
                          </li>
                          <li>
                            Jansson, K. H., Tucker, J. B., Stahl, L. E., Simmons, J. K., Fuller, C., <span className="font-semibold text-heading">Abbey, Y. C.</span>, et al. (2018). High-throughput
                            screens identify HSP90 inhibitors as potent therapeutics that target inter-related growth and survival pathways in advanced prostate cancer.
                            <span className="italic"> Scientific Reports</span>, 8, 17239.{" "}
                            <a
                              href="https://doi.org/10.1038/s41598-018-35417-0"
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-[color:var(--accent)]/70 underline-offset-2 hover:decoration-[color:var(--accent)]"
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

        <aside className="mt-2 flex flex-col gap-4 rounded-2xl card-surface p-5 text-[0.984375rem] text-body shadow-[0_16px_50px_rgba(0,0,0,0.45)] sm:p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-muted)]" />
            <div>
                <p className="text-[0.84375rem] uppercase tracking-[0.22em] text-muted-strong">
                  Yasmine C. Abbey, MD, MSc
                </p>
                <p className="mt-1 text-[14.625px] text-body">
                  Third-year Internal Medicine resident at Cedars-Sinai in Los
                  Angeles, building physician-made clinical tools.
                </p>
              </div>
            </div>

            <p className="text-[14.625px] leading-relaxed text-body">
              My work lives at the intersection of bedside medicine, clinical
              research, and software. I care about reducing cognitive load for
              clinicians so we can focus on the parts of the job that actually
              require a human.
            </p>

            <div className="mt-1 flex flex-wrap gap-2">
              <a
                href="mailto:Yasmineabbey@gmail.com"
                className="inline-flex items-center rounded-full border border-[color:var(--accent)] px-3 py-1.5 text-[12.375px] font-semibold uppercase tracking-[0.18em] text-heading transition hover:bg-[color:var(--accent)] hover:text-[color:var(--neutral-text)]"
              >
                Email me
              </a>
              <a
                href="https://www.linkedin.com/in/yasmine-cheryl-abbey-503b3197/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--pill-bg)]/70 px-3 py-1.5 text-[12.375px] font-semibold uppercase tracking-[0.18em] text-heading transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                View LinkedIn
              </a>
            </div>
        </aside>
        </section>
    </main>
  );
}
