// Restyled tools directory to Olive V3 cards, filters, and typography
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

import SiteHeader from "@/components/SiteHeader";
import { CONFIG } from "@/config/notomed-config";

type ToolCategory = "Analgesia" | "Electrolytes" | "Peri-op" | "Endocrine";

type Tool = {
  id: string;
  name: string;
  description: string;
  path: string;
  category: ToolCategory;
  isPlaceholder?: boolean;
  createdAt: string;
  lastUpdated: string;
};

type SortKey = "alphabetical" | "recent" | "created";

const TOOLS: Tool[] = [
  {
    id: "opioid-tool",
    name: "Inpatient Opioid Regimen Builder",
    description: "Build a custom inpatient opiate regimen with safety checks.",
    path: CONFIG.opioidToolPath,
    category: "Analgesia",
    createdAt: "2023-08-15",
    lastUpdated: "2025-11-10",
  },
  {
    id: "hyponatremia-tool",
    name: "Hyponatremia Calculator",
    description: "Guided thinking for low sodium with safety in mind.",
    path: CONFIG.hyponatremiaToolPath,
    category: "Electrolytes",
    createdAt: "2023-06-01",
    lastUpdated: "2025-11-05",
  },
  {
    id: "preop-tool",
    name: "AI-powered Pre-op Risk Stratifier",
    description: "Simple pre-op risk write-up you can paste into the EHR.",
    path: CONFIG.preopToolPath,
    category: "Peri-op",
    createdAt: "2024-02-01",
    lastUpdated: "2025-11-14",
  },
  {
    id: "insulin-tool",
    name: "Insulin Titration Helper (Beta)",
    description: "Basal/bolus calculators with guardrails.",
    path: "#",
    category: "Endocrine",
    isPlaceholder: true,
    createdAt: "2024-05-01",
    lastUpdated: "2025-11-01",
  },
];

const CATEGORIES = [
  "All",
  ...Array.from(new Set(TOOLS.map((tool) => tool.category))),
] as const;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "alphabetical", label: "A–Z" },
  { key: "recent", label: "Recently updated" },
  { key: "created", label: "Creation date" },
];

function getDaysAgo(dateString: string): number | null {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function formatUpdated(dateString: string): string {
  const days = getDaysAgo(dateString);
  if (days === null) return "Updated";
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated 1 day ago";
  if (days < 30) return `Updated ${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "Updated 1 month ago";
  return `Updated ${months} months ago`;
}

function isNewTool(dateString: string): boolean {
  const daysAgo = getDaysAgo(dateString);
  return daysAgo !== null && daysAgo <= 7;
}

function sortTools(tools: Tool[], sortKey: SortKey): Tool[] {
  const cloned = [...tools];
  switch (sortKey) {
    case "recent":
      return cloned.sort(
        (a, b) => +new Date(b.lastUpdated) - +new Date(a.lastUpdated),
      );
    case "created":
      return cloned.sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();

        const aInvalid = Number.isNaN(aTime);
        const bInvalid = Number.isNaN(bTime);

        if (aInvalid && bInvalid) return 0;
        if (aInvalid) return 1;
        if (bInvalid) return -1;

        if (aTime === bTime) {
          return a.name.localeCompare(b.name);
        }

        return aTime - bTime;
      });
    case "alphabetical":
    default:
      return cloned.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export default function ToolsDirectoryClient() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [sortKey, setSortKey] = useState<SortKey>("alphabetical");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const filteredAndSorted = useMemo(() => {
    const query = q.toLowerCase();
    const matches = TOOLS.filter((tool) => {
      const matchesCat = cat === "All" || tool.category === cat;
      const matchesQuery =
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });

    return sortTools(matches, sortKey);
  }, [q, cat, sortKey]);

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-12">
        <div className="mb-4 text-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--pill-border)] bg-[var(--pill-bg)] px-4 py-2 text-sm font-medium text-[var(--pill-text)] transition-colors hover:border-[var(--accent-hover)]"
          >
            ← Back to NotoMed.dev
          </Link>
        </div>

        <header className="mb-10 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-muted)]">Directory</p>
          <h1 className="text-3xl font-semibold text-[var(--text-heading)]">Tools</h1>
          <p className="max-w-xl text-sm text-[var(--text-body)] md:text-base">
            Physician-built, evidence-minded utilities for inpatient workflows. New tools are added regularly.
          </p>
        </header>

        <section className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md">
            <label htmlFor="tool-search" className="sr-only">
              Search tools
            </label>
            <input
              id="tool-search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search (e.g. sodium, pre-op, opioids)…"
              className="input-olive w-full rounded-xl px-4 py-2.5 text-sm shadow-[0_12px_36px_rgba(0,0,0,0.25)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
            <div className="flex items-center gap-2 text-xs text-[var(--text-body)]">
              <span>Sort by</span>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="input-olive rounded-full px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/60"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-[var(--pill-border)] bg-[var(--pill-bg)] px-3 py-1 text-[11px] text-[var(--pill-text)] transition-colors hover:border-[var(--accent-hover)] md:hidden"
              onClick={() => setShowFiltersMobile((prev) => !prev)}
            >
              Filters
              <span aria-hidden>{showFiltersMobile ? "▲" : "▼"}</span>
            </button>
          </div>
        </section>

        <section
          className={`mb-8 flex flex-wrap gap-2 text-xs transition-[max-height,opacity] md:max-h-none md:opacity-100 ${
            showFiltersMobile ? "max-h-40 opacity-100" : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
          }`}
        >
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setCat(category)}
              className={[
                "rounded-full border px-3 py-1 text-sm transition-colors",
                cat === category
                  ? "border-[var(--accent-hover)] bg-[var(--accent)] text-[var(--neutral-text)]"
                  : "border-[var(--pill-border)] bg-[var(--pill-bg)] text-[var(--pill-text)] hover:border-[var(--accent-hover)]",
              ].join(" ")}
            >
              {category}
            </button>
          ))}
        </section>

        {filteredAndSorted.length === 0 ? (
          <p className="mt-8 text-sm text-[var(--text-body)]">No tools match your search.</p>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAndSorted.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const isLive = !tool.isPlaceholder && tool.path !== "#";
  const updatedLabel = formatUpdated(tool.lastUpdated);
  const isNew = !tool.isPlaceholder && isNewTool(tool.createdAt);

  const cardClasses = [
    "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-6 shadow-[0_22px_70px_rgba(0,0,0,0.7)] transition-transform duration-200",
    tool.isPlaceholder
      ? "card-muted opacity-80"
      : "card-surface hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(0,0,0,0.9)]",
  ].join(" ");

  const content = (
    <div className={cardClasses}>
      <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(214,129,88,0.4),transparent_65%)] blur-3xl" />
      </div>
      <div className="relative flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-heading)] md:text-xl">{tool.name}</h2>
          {isNew && (
            <span className="chip-new shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
              NEW
            </span>
          )}
        </div>
        <p className="flex-1 text-sm leading-relaxed text-[var(--text-body)] md:text-[15px]">{tool.description}</p>
      </div>

      <div className="relative mt-6 flex items-center justify-between border-t card-divider pt-4 text-[12px] text-[var(--text-body)]">
        <div className="flex flex-col gap-1.5">
          <span className="pill-outline inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wide">
            {tool.category}
          </span>
          <span className="text-[11px] text-[var(--text-muted-strong)]">{updatedLabel}</span>
        </div>

        {tool.isPlaceholder ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--text-muted-strong)] group-hover:text-[var(--text-heading)]">
            Coming soon
            <span aria-hidden>→</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] transition-colors group-hover:text-[var(--accent-hover)]">
            {isLive ? "Open tool" : "Coming soon"}
            <span aria-hidden>→</span>
          </span>
        )}
      </div>
    </div>
  );

  if (isLive) {
    return (
      <Link href={tool.path} className="block focus:outline-none">
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}
