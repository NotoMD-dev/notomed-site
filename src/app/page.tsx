// Restyled landing page to Olive V3 palette with unified cards and forms, logic unchanged
"use client";

import Link from "next/link";
import { Heart, Mail, Search, Send } from "lucide-react";
import React from "react";

import SiteHeader from "@/components/SiteHeader";
import { CONFIG } from "@/config/notomed-config";

type ToolCard = {
  id: string;
  name: string;
  description: string;
  link: string;
  isPlaceholder?: boolean;
};

const TOOLS: ToolCard[] = [
  {
    id: "opioid-tool",
    name: "Inpatient Opioid Regimen Builder",
    description: "Build a custom inpatient opiate regimen with safety checks.",
    link: CONFIG.opioidToolPath,
  },
  {
    id: "hyponatremia-tool",
    name: "Hyponatremia Calculator",
    description: "Guided thinking for low sodium with safety in mind.",
    link: CONFIG.hyponatremiaToolPath,
  },
];

export default function NotoMedLandingPage() {
  const [submitStatus, setSubmitStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [supportAmount, setSupportAmount] = React.useState("5");
  const [supportLoading, setSupportLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredTools = TOOLS.filter((tool) =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        const msg =
          (data && data.error) || text || "Could not start checkout (server error).";
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

      <main className="mx-auto max-w-5xl space-y-24 px-4 pb-20 pt-16 sm:pt-20">
        <section className="text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#989180]">
            Project
          </p>
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-[#f9f6ef] md:text-5xl">
            Physician-made clinical tools.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-base text-[#d0c8b9] md:text-lg">
            Creating web applications that simplify workflow and decrease cognitive load.
          </p>
          <p className="text-xs text-[#a89f8f]">All tools built by {CONFIG.creatorName}</p>

          <div className="relative mx-auto mt-8 max-w-xl">
            <div className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 transform items-center pl-4">
              <Search className="h-4 w-4 text-[#989180]" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search tools (e.g. opioid, sodium)..."
              className="w-full rounded-xl border border-[#788878] bg-[#405247]/90 py-3 pl-11 pr-4 text-sm text-[#f6f2eb] placeholder-[#989180] shadow-[0_16px_45px_rgba(0,0,0,0.55)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#d27e58]/70 transition-all"
            />
            <div className="pointer-events-none mt-2 flex justify-center text-[11px] text-[#989180]">
              <span className="rounded-full border border-[#788878] bg-[#405247]/90 px-2 py-1 shadow-[0_10px_32px_rgba(0,0,0,0.55)]">
                Try: opioid regimen • hyponatremia
              </span>
            </div>
          </div>
        </section>

        <section id="tools" className="scroll-mt-24">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filteredTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.link}
                className="group relative overflow-hidden rounded-2xl border border-[#7a897b] bg-gradient-to-br from-[#3f5143] via-[#475b4c] to-[#506656] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.7)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(0,0,0,0.9)]"
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(214,129,88,0.4),transparent_65%)] blur-3xl" />
                </div>
                <div className="relative">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9384]">Tool</p>
                  <h3 className="mb-2 text-lg font-semibold text-[#f9f6ef]">{tool.name}</h3>
                  <p className="mb-6 text-sm text-[#d4cbba]">{tool.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f0a46c] transition-colors group-hover:text-[#f3b083]">
                    Open Tool
                    <span aria-hidden className="translate-x-0 transition-transform duration-200 group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            ))}

            <div className="group relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#7a897b] bg-[#3b4c40] p-6 text-center shadow-[0_20px_70px_rgba(0,0,0,0.7)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(0,0,0,0.9)]">
              <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(214,129,88,0.4),transparent_65%)] blur-3xl" />
              </div>
              <div className="relative">
                <h3 className="mb-2 text-lg font-semibold text-[#f9f6ef]">Missing something?</h3>
                <p className="mb-4 max-w-xs text-sm text-[#d4cbba]">
                  Suggest a new workflow, calculator, or builder you wish existed on rounds.
                </p>
                <Link
                  href="#contact"
                  className="inline-flex items-center rounded-full border border-[#7a897b] bg-[#435447] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[#f0e5d7] transition-colors hover:border-[#f0a46c] hover:text-[#f3b083]"
                >
                  Send Feedback
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 border-t border-[#485347] pt-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[#f9f6ef]">
                <Send className="h-4 w-4" />
                <h2 className="text-2xl font-semibold">Feedback & enquiries</h2>
              </div>
              <p className="mb-6 text-sm text-[#d4cbba]">
                For suggestions, bug reports, or requests for new tools.
              </p>
              <form onSubmit={handleInternalFormSubmit} className="space-y-4 text-sm">
                <div>
                  <label htmlFor="tool" className="text-xs font-medium text-[#a89f8f]">
                    Tool
                  </label>
                  <select
                    id="tool"
                    name="tool"
                    className="mt-1 block w-full rounded-md border border-[#788878] bg-[#405247] px-3 py-2 text-sm text-[#f6f2eb] focus:outline-none focus:ring-1 focus:ring-[#d27e58]/70"
                    defaultValue="Opioid Regimen Builder"
                  >
                    <option>Opioid Regimen Builder</option>
                    <option>Hyponatremia Calculator</option>
                    <option>General website / new tool idea</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="text-xs font-medium text-[#a89f8f]">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="mt-1 block w-full resize-y rounded-md border border-[#788878] bg-[#405247] px-3 py-2 text-sm text-[#f6f2eb] focus:outline-none focus:ring-1 focus:ring-[#d27e58]/70"
                    placeholder="Describe the issue or idea..."
                  />
                </div>

                {submitStatus === "success" ? (
                  <div className="rounded-md border border-[#55b46d]/30 bg-[#1d2d24] px-3 py-2 text-xs text-[#55b46d]">
                    Thanks — got it.
                  </div>
                ) : submitStatus === "error" ? (
                  <div className="rounded-md border border-[#e57d6a]/40 bg-[#2f1f1c] px-3 py-2 text-xs text-[#e57d6a]">
                    Something went wrong. Try again.
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="rounded-md bg-[#f4f1ea] px-4 py-2 text-sm font-medium text-[#25221e] transition-colors hover:bg-[#e3ddcf]"
                  >
                    Submit
                  </button>
                )}
              </form>
            </div>

            <div id="support">
              <div className="mb-2 flex items-center gap-2 text-[#f9f6ef]">
                <Heart className="h-4 w-4" />
                <h2 className="text-2xl font-semibold">Support notomed</h2>
              </div>
              <p className="mb-6 text-sm text-[#d4cbba]">
                All applications were built after hours and took significant time and determination to make. If they save you time or help in anyway, you can support it here.
              </p>

              <div className="flex flex-col gap-3 text-sm">
                <form onSubmit={handleSupportSubmit} className="flex flex-wrap items-center gap-3">
                  <label className="text-xs text-[#a89f8f]" htmlFor="amount">
                    Amount (USD)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    step="1"
                    value={supportAmount}
                    onChange={(e) => setSupportAmount(e.target.value)}
                    className="w-24 rounded-md border border-[#788878] bg-[#405247] px-3 py-2 text-sm text-[#f6f2eb] focus:outline-none focus:ring-1 focus:ring-[#d27e58]/70"
                  />
                  <button
                    type="submit"
                    disabled={supportLoading}
                    className="inline-flex items-center gap-2 rounded-md bg-[#d27e58] px-5 py-2 text-sm font-medium text-[#221813] transition-colors hover:bg-[#e29a6c] disabled:opacity-50"
                  >
                    <Heart className="h-4 w-4" />
                    {supportLoading ? "Redirecting..." : "Support"}
                  </button>
                </form>

                <Link
                  href={`mailto:${CONFIG.contactEmail}`}
                  className="inline-flex items-center gap-2 rounded-md border border-[#7a897b] bg-[#435447] px-4 py-2 text-sm font-medium text-[#f0e5d7] transition-colors hover:border-[#f0a46c] hover:text-[#f3b083]"
                >
                  <Mail className="h-4 w-4" />
                  Contact Me!
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
