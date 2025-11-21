// Restyled tools directory to Olive V3 cards, filters, and typography
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

import SiteHeader from "@/components/SiteHeader";
import { BackButton } from "@/components/BackButton";
import { GlowCard } from "@/components/cards/GlowCard";
import { SearchInput } from "@/components/SearchInput";
import {
  toolsData,
  type ToolDefinition,
  type ToolTag,
} from "@/config/tools-data";
import {
  filterTools,
  formatToolUpdated,
  getLivePath,
  isNewTool,
  sortTools,
  TOOL_CATEGORY_FILTERS,
  TOOL_SORT_OPTIONS,
  type ToolCategoryFilter,
  type ToolSortKey,
} from "@/lib/tools";

export default function ToolsDirectoryClient() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ToolCategoryFilter>("All");
  const [sortKey, setSortKey] = useState<ToolSortKey>("alphabetical");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const filteredAndSorted = useMemo(() => {
    const matches = filterTools(toolsData, { query: q, category: cat });
    return sortTools(matches, sortKey);
  }, [q, cat, sortKey]);

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-12">
        <header className="mb-10 space-y-2">
          <BackButton href="/" />
          <h1 className="text-3xl font-semibold text-[var(--text-heading)]">Tools</h1>
          <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-muted)]">Directory</p>
          <p className="max-w-xl text-sm text-[var(--text-body)] md:text-base">
            Physician-built, evidence-minded utilities for inpatient workflows. New tools are added regularly.
          </p>
        </header>

        <section className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md">
            <SearchInput
              id="tool-search"
              label="Search tools"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search (e.g. sodium, pre-op, opioids)…"
              variant="compact"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
            <div className="flex items-center gap-2 text-xs text-[var(--text-body)]">
              <span>Sort by</span>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as ToolSortKey)}
                className="input-olive rounded-full px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/60"
              >
                {TOOL_SORT_OPTIONS.map((option) => (
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
          {TOOL_CATEGORY_FILTERS.map((category) => (
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

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const livePath = getLivePath(tool);
  const isLive = Boolean(livePath);
  const updatedLabel = formatToolUpdated(tool.lastUpdated);
  const isNew = isNewTool(tool.createdAt);
  const displayTags: ToolTag[] = [...(tool.tags ?? [])];

  if (isNew && !displayTags.includes("NEW")) {
    displayTags.push("NEW");
  }

  const card = (
    <GlowCard
      variant={isLive ? "surface" : "muted"}
      interactive={isLive}
      disableGlow={!isLive}
      className="flex h-full flex-col justify-between"
    >
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {displayTags.map((tag) => (
                  <span key={tag} className={getTagClasses(tag)}>
                    {getTagLabel(tag)}
                  </span>
                ))}
              </div>
            )}
            <h2 className="text-lg font-semibold text-[var(--text-heading)] md:text-xl">{tool.name}</h2>
          </div>
        </div>
        <p className="flex-1 text-sm leading-relaxed text-[var(--text-body)] md:text-[15px]">{tool.description}</p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t card-divider pt-4 text-[12px] text-[var(--text-body)]">
        <div className="flex flex-col gap-1.5">
          <span className="pill-outline inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wide">
            {tool.category}
          </span>
          <span className="text-[11px] text-[var(--text-muted-strong)]">{updatedLabel}</span>
        </div>

        <span
          className={[
            "inline-flex items-center gap-1 text-sm font-semibold",
            isLive
              ? "text-[var(--accent)] transition-colors group-hover:text-[var(--accent-hover)]"
              : "text-[var(--text-muted-strong)]",
          ].join(" ")}
        >
          {isLive ? "Open tool" : "Coming soon"}
          <span aria-hidden>→</span>
        </span>
      </div>
    </GlowCard>
  );

  if (isLive && livePath) {
    return (
      <Link href={livePath} className="block focus-visible:outline-none">
        {card}
      </Link>
    );
  }

  return card;
}

function getTagClasses(tag: ToolTag) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide";

  switch (tag) {
    case "FEATURED":
      return `${base} border border-[var(--accent-hover)] bg-[var(--accent)] text-[var(--neutral-text)]`;
    case "BETA":
      return `${base} border border-[var(--accent-hover)] bg-[var(--accent)]/10 text-[var(--accent)]`;
    case "COMING_SOON":
      return `${base} pill-outline`;
    case "NEW":
    default:
      return `${base} chip-new`;
  }
}

function getTagLabel(tag: ToolTag) {
  return tag.replace(/_/g, " ");
}
