"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

import { CONFIG } from "@/config/notomed-config";

type ToolCategory =
  | "Analgesia"
  | "Electrolytes"
  | "Peri-op"
  | "Endocrine"
  | "Cards"
  | "Misc";

type Tool = {
  id: string;
  name: string;
  description: string;
  path: string;
  category: ToolCategory;
  isPlaceholder?: boolean;
  isNew?: boolean;
  lastUpdated: string;
};

type SortKey = "alphabetical" | "recent";

const TOOLS: Tool[] = [
  {
    id: "opioid-tool",
    name: "Inpatient Opioid Regimen Builder",
    description: "Build a custom inpatient opiate regimen with safety checks.",
    path: CONFIG.opioidToolPath,
    category: "Analgesia",
    lastUpdated: "2025-11-10",
  },
  {
    id: "hyponatremia-tool",
    name: "Hyponatremia Calculator",
    description: "Guided thinking for low sodium with safety in mind.",
    path: CONFIG.hyponatremiaToolPath,
    category: "Electrolytes",
    lastUpdated: "2025-11-05",
  },
  {
    id: "preop-tool",
    name: "AI-powered Pre-op Risk Stratifier",
    description: "Simple pre-op risk write-up you can paste into the EHR.",
    path: "#feedback",
    category: "Peri-op",
    isPlaceholder: true,
    isNew: true,
    lastUpdated: "2025-11-14",
  },
  {
    id: "insulin-tool",
    name: "Insulin Titration Helper (Beta)",
    description: "Basal/bolus calculators with guardrails.",
    path: "#",
    category: "Endocrine",
    isPlaceholder: true,
    isNew: true,
    lastUpdated: "2025-11-01",
  },
  {
    id: "ards-tool",
    name: "ARDS / Oxygen Escalation",
    description: "Stepwise oxygen + ventilatory strategy guidance.",
    path: "#",
    category: "Cards",
    isPlaceholder: true,
    lastUpdated: "2025-10-20",
  },
  {
    id: "repletion-tool",
    name: "Fluids & Electrolytes: Quick Repletion",
    description: "Potassium, magnesium, phosphate dosing hints.",
    path: "#",
    category: "Electrolytes",
    isPlaceholder: true,
    lastUpdated: "2025-10-15",
  },
];

const CATEGORIES = [
  "All",
  ...Array.from(new Set(TOOLS.map((tool) => tool.category))),
] as const;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "alphabetical", label: "A–Z" },
  { key: "recent", label: "Recently updated" },
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

function sortTools(tools: Tool[], sortKey: SortKey): Tool[] {
  const cloned = [...tools];
  switch (sortKey) {
    case "recent":
      return cloned.sort(
        (a, b) => +new Date(b.lastUpdated) - +new Date(a.lastUpdated),
      );
    case "alphabetical":
    default:
      return cloned.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export default function ToolsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [sortKey, setSortKey] = useState<SortKey>("alphabetical");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const filteredAndSorted = useMemo(() => {
    const filtered = TOOLS.filter((tool) => {
      const matchesCat = cat === "All" || tool.category === cat;
      const query = q.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });

    return sortTools(filtered, sortKey);
  }, [q, cat, sortKey]);

  return (
    <div className="relative z-10 min-h-screen text-gray-900">
      <div
        className="fixed inset-0 bg-white"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent 40px)",
          backgroundSize: "40px 40px",
          zIndex: -1,
        }}
      />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 text-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white/80 px-3 py-1 text-[11px] font-medium tracking-tight text-gray-700 hover:bg-gray-100"
          >
            <span aria-hidden>←</span>
            Back to notomed.dev
          </Link>
        </div>

        <header className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gray-500">
            Directory
          </p>
          <h1 className="mb-2 text-3xl font-bold">Tools</h1>
          <p className="max-w-xl text-xs text-gray-600 md:text-sm">
            Physician-built, evidence-minded utilities for inpatient workflows.
            New tools are added regularly.
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
              className="w-full rounded-full border border-gray-300 bg-white/80 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">Sort by</span>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="rounded-full border border-gray-300 bg-white/80 px-2 py-1 text-xs focus:outline-none"
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
              className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white/80 px-3 py-1 text-[11px] text-gray-700 hover:bg-gray-100 md:hidden"
              onClick={() => setShowFiltersMobile((prev) => !prev)}
            >
              Filters
              <span aria-hidden>{showFiltersMobile ? "▲" : "▼"}</span>
            </button>
          </div>
        </section>

        <section
          className={`mb-6 flex flex-wrap gap-2 text-xs transition-[max-height,opacity] md:max-h-none md:opacity-100 ${
            showFiltersMobile
              ? "max-h-40 opacity-100"
              : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
          }`}
        >
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setCat(category)}
              className={[
                "rounded-full border px-3 py-1",
                cat === category
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-gray-300 bg-white/80 text-gray-700 hover:bg-gray-100",
              ].join(" ")}
            >
              {category}
            </button>
          ))}
        </section>

        {filteredAndSorted.length === 0 ? (
          <p className="mt-8 text-xs text-gray-500">No tools match your search.</p>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

  const content = (
    // To disable hover float, remove hover:-translate-y-0.5 and hover:shadow-md.
    <div className="group flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-indigo-500">
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900">{tool.name}</h2>
          {tool.isNew && (
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
              NEW
            </span>
          )}
        </div>
        <p className="flex-1 text-xs leading-relaxed text-gray-600">
          {tool.description}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-[11px]">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-700">
            {tool.category}
          </span>
          <span className="text-[10px] text-gray-500">{updatedLabel}</span>
        </div>

        {tool.isPlaceholder ? (
          <span className="inline-flex items-center gap-1 text-gray-500 group-hover:text-gray-700">
            Coming soon
            <span aria-hidden>→</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-indigo-700 group-hover:text-indigo-900">
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
