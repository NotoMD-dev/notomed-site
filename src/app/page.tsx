// Restyled landing page to Olive V3 palette with unified cards, theme toggle, and restored tools directory CTA
"use client";

import Link from "next/link";
import { Heart, Mail } from "lucide-react";
import React from "react";

import SiteHeader from "@/components/SiteHeader";
import { GlowCard } from "@/components/cards/GlowCard";
import { SearchInput } from "@/components/SearchInput";
import { CONFIG } from "@/config/notomed-config";
import type { ToolTag } from "@/config/tools-data";
import { cn } from "@/lib/cn";
import {
  FEATURED_TOOL_LIMIT,
  filterTools,
  getLiveTools,
  isNewTool,
} from "@/lib/tools";

const LIVE_TOOLS = getLiveTools();

export default function NotoMedLandingPage() {
  const [submitStatus, setSubmitStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [supportAmount, setSupportAmount] = React.useState("5");
  const [supportLoading, setSupportLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const featuredTools = LIVE_TOOLS.filter((tool) => tool.tags?.includes("FEATURED"));
  const featuredNoteSummarizer = featuredTools.find(
    (tool) => tool.id === "note-summarizer-tool",
  );
  const baseTools = searchTerm ? filterTools(LIVE_TOOLS, { query: searchTerm }) : LIVE_TOOLS;
  const primaryTool = featuredNoteSummarizer ?? featuredTools[0] ?? baseTools[0];
  const displayedTools = [
    primaryTool,
    ...baseTools.filter((tool) => tool.id !== primaryTool?.id),
  ]
    .filter(Boolean)
    .slice(0, FEATURED_TOOL_LIMIT);

  const handleInternalFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      id: crypto.randomUUID(),
      tool: formData.get("tool"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("bad response");

      setSubmitStatus("success");
      form.reset();
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } catch (err) {
      console.error(err);
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 5000);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(supportAmount);

    if (Number.isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount (e.g. 5).");
      return;
    }

    setSupportLoading(true);
    try {
      const res = await fetch("/api/support/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum }),
      });

      let data: { url?: string; error?: string } | null = null;
      const text = await res.text();

      try {
        const parsed = JSON.parse(text) as unknown;
        if (parsed && typeof parsed === "object") {
          data = parsed as { url?: string; error?: string };
        } else {
          data = null;
        }
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = (data && data.error) || text || "Could not start checkout (server error).";
        alert(msg);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout started but no URL was returned.");
      }
    } catch (err) {
      console.error(err);
      alert("Could not start checkout (network).");
    } finally {
      setSupportLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl space-y-24 px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <section className="text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-muted">
            Project
          </p>
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-heading sm:text-5xl lg:text-6xl">
            Physician-made clinical tools.
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-base text-body md:text-lg">
            Creating web applications that simplify workflow and decrease cognitive load.
          </p>
          <p className="text-xs text-muted-strong">All tools built by {CONFIG.creatorName}</p>

          <div className="relative mx-auto mt-8 max-w-2xl px-2 sm:px-0">
            <SearchInput
              id="landing-tool-search"
              label="Search all clinical tools"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search tools (e.g. opioid, sodium)..."
            />
            <div className="pointer-events-none mt-2 flex justify-center text-[11px] text-muted">
              <span className="pill-outline rounded-full px-2 py-1 shadow-[0_10px_32px_rgba(0,0,0,0.15)]">
                Try: opioid regimen • hyponatremia
              </span>
            </div>
          </div>
        </section>

        <section id="tools" className="scroll-mt-24">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {displayedTools.map((tool) => {
              const tags = buildTags(tool.tags, tool.createdAt);
              const isFeatured = tags.includes("FEATURED");

              return (
                <Link key={tool.id} href={tool.path} className="block focus-visible:outline-none">
                  <GlowCard
                    className={cn(
                      "min-h-[230px]",
                      isFeatured &&
                        "border-2 border-[var(--accent)] shadow-[0_28px_80px_rgba(0,0,0,0.6)] ring-2 ring-[var(--accent)]/40",
                    )}
                    aria-label={`Open ${tool.name}`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-strong">
                        Tool
                      </p>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {tags.map((tag) => (
                            <span key={tag} className={getHeroTagClasses(tag)}>
                              {tag === "FEATURED" ? "Featured" : tag === "NEW" ? "New" : tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-heading">{tool.name}</h3>
                    <p className="mb-6 text-sm text-body">{tool.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent transition-transform group-hover:translate-x-1">
                      Open Tool →
                    </span>
                  </GlowCard>
                </Link>
              );
            })}

            <Link href="/tools" className="block focus-visible:outline-none">
              <GlowCard className="flex h-full flex-col justify-between">
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-strong">
                    Directory
                  </p>
                  <h3 className="mb-2 text-lg font-semibold text-heading">Browse all tools</h3>
                  <p className="mb-6 text-sm text-body">
                    See every workflow, including the AI pre-op risk stratifier and upcoming utilities.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent transition-transform group-hover:translate-x-1">
                  Go to tools →
                </span>
              </GlowCard>
            </Link>

            <GlowCard
              variant="dashed"
              interactive
              className="flex flex-col items-center justify-center text-center"
            >
              <h3 className="mb-2 text-lg font-semibold text-heading">Missing something?</h3>
              <p className="mb-4 max-w-xs text-sm text-body">
                Suggest a new workflow, calculator, or builder you wish existed on rounds.
              </p>
              <Link
                href="#contact"
                className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] btn-outline"
              >
                Send Feedback
              </Link>
            </GlowCard>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 border-t border-[color:var(--card-outline)] pt-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-2 text-2xl font-semibold text-heading">Feedback & enquiries</h2>
              <p className="mb-6 text-sm text-body">
                For suggestions, bug reports, or requests for new tools.
              </p>
              <form onSubmit={handleInternalFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="tool" className="text-xs font-medium text-muted-strong">
                    Tool
                  </label>
                  <select
                    id="tool"
                    name="tool"
                    className="input-olive mt-1 block w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]/70"
                  >
                    <option>Opioid Regimen Builder</option>
                    <option>Hyponatremia Calculator</option>
                    <option>General / New Tool Idea</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="text-xs font-medium text-muted-strong">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="input-olive mt-1 block w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]/70"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-neutral rounded-md px-4 py-2 text-sm font-medium transition-colors"
                >
                  Submit
                </button>
                {submitStatus === "success" && (
                  <p className="mt-2 text-xs text-[#55b46d]">Thanks for your feedback.</p>
                )}
                {submitStatus === "error" && (
                  <p className="mt-2 text-xs text-[#e57d6a]">Something went wrong. Please try again.</p>
                )}
              </form>
            </div>

            <div id="support">
              <h2 className="mb-2 text-2xl font-semibold text-heading">Support development</h2>
              <p className="mb-6 text-sm text-body">
                If these tools save you time on the wards, consider supporting future maintenance and new builds.
              </p>
              <div className="space-y-4">
                <form
                  onSubmit={handleSupportSubmit}
                  className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <input
                    type="number"
                    value={supportAmount}
                    min={1}
                    onChange={(event) => setSupportAmount(event.target.value)}
                    className="input-olive w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]/70 sm:w-28"
                  />
                  <button
                    type="submit"
                    disabled={supportLoading}
                    className="btn-primary inline-flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Heart className="h-4 w-4" />
                    {supportLoading ? "Processing" : "Support"}
                  </button>
                </form>
                <p className="text-xs text-muted">
                  Or connect via LinkedIn to share feedback and ideas.
                  <Link
                    href={CONFIG.linkedInUrl}
                    className="ml-1 inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    LinkedIn
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function buildTags(tags: ToolTag[] | undefined, createdAt: string): ToolTag[] {
  const mergedTags: ToolTag[] = [...(tags ?? [])];
  if (isNewTool(createdAt) && !mergedTags.includes("NEW")) {
    mergedTags.push("NEW");
  }
  return mergedTags;
}

function getHeroTagClasses(tag: ToolTag) {
  const base =
    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide";

  switch (tag) {
    case "FEATURED":
      return `${base} border border-[var(--accent-hover)] bg-[var(--accent)] text-[var(--neutral-text)] shadow-[0_12px_30px_rgba(0,0,0,0.22)]`;
    case "NEW":
      return `${base} chip-new`;
    case "BETA":
    case "COMING_SOON":
    default:
      return `${base} border border-[var(--pill-border)] bg-[var(--pill-bg)] text-[var(--pill-text)]`;
  }
}
