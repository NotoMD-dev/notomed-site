// src/app/page.tsx
"use client";

import Link from "next/link";
import { ChevronRight, Send, Heart, Mail, Linkedin } from "lucide-react";
import React from "react";

// === CONFIGURATION ===
const CONFIG = {
  linkedInUrl: "https://www.linkedin.com/in/yasmine-cheryl-abbey-503b3197/",
  creatorName: "Yasmine Abbey, MD, MSc",
  contactEmail: "yasmineabbey@gmail.com",
  opioidToolPath: "/tools/opioid-calc",
  hyponatremiaToolPath: "/tools/hypona-calc",
};

const TOOLS = [
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
  {
    id: "next-tool",
    name: "AI powered pre-op risk stratifier  (pending)",
    description: "Easy to use pre-op risk stratifier that can be copied and pasted to your EHR.",
    link: "#feedback",
    isPlaceholder: true,
  },
];

export default function NotoMedLandingPage() {
  const [submitStatus, setSubmitStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [supportAmount, setSupportAmount] = React.useState("5");
  const [supportLoading, setSupportLoading] = React.useState(false);

  // FEEDBACK submit
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

  // SUPPORT submit (Stripe)
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

    let data: any = null;
    const text = await res.text();

    // try to parse JSON, but don't die if it's HTML
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg =
        (data && data.error) ||
        text ||
        "Could not start checkout (server error).";
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
    <>
      {/* GRID BACKGROUND */}
      <div
        className="fixed inset-0 bg-white"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent 40px)",
          backgroundSize: "40px 40px",
          zIndex: 0,
        }}
      />

      {/* PAGE WRAPPER */}
      <div className="relative z-10 min-h-screen text-gray-900">
        {/* TOP BAR */}
        <header className="w-full border-b border-gray-300 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="text-lg font-semibold tracking-tight">notomed.dev</div>
            <nav className="flex gap-6 text-sm">
              <Link href="/about" className="hover:text-black">
                About
              </Link>
              <a href="#tools" className="hover:text-black">
                Tools
              </a>
              <a href="#feedback" className="hover:text-black">
                Feedback
              </a>
              <a href="#support" className="hover:text-black">
                Support
              </a>
            </nav>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
          {/* HERO */}
          <section className="bg-white border border-gray-300 w-full">
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr,0.6fr]">
              {/* LEFT */}
              <div className="border-b md:border-b-0 md:border-r border-gray-300 p-6 md:p-8">
                <p className="uppercase tracking-[0.3em] text-xs text-gray-500 mb-3">Project</p>
                <h1 className="text-3xl md:text-[2.7rem] leading-tight font-bold mb-4">
                  Physician-made clinical tools.
                </h1>
                <p className="text-sm md:text-base leading-relaxed mb-6 max-w-2xl">
                  Creating web applications that simplify workflow and decrease cognitive load. All
                  tools created with the assistance of AI.
                </p>
                <p className="text-xs text-gray-500">All tools built by {CONFIG.creatorName}</p>
              </div>

              {/* RIGHT */}
              <div className="p-6 md:p-8 bg-gray-50/50">
                <p className="uppercase tracking-[0.3em] text-xs text-gray-500 mb-3">Current</p>
                <ul className="space-y-2 text-sm">
                  <li>Inpatient Opioid Regimen Builder</li>
                  <li>Hyponatremia Calculator</li>
                  <li className="text-gray-400">+ future tools</li>
                </ul>
                <div className="mt-6">
                  <Link
                    href={CONFIG.linkedInUrl}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-900"
                  >
                    <Linkedin className="w-4 h-4" />
                    Connect with me
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* TOOL ROW */}
          <section id="tools" className="bg-white border border-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-3">
              {TOOLS.map((tool, idx) => (
                <div
                  key={tool.id}
                  className={`p-6 border-t md:border-t-0 border-gray-300 ${
                    idx !== 0 ? "md:border-l" : ""
                  } ${tool.isPlaceholder ? "bg-gray-100/70 text-gray-500" : ""}`}
                >
                  <h2
                    className={`text-sm font-semibold mb-1 ${
                      tool.isPlaceholder ? "text-gray-600" : ""
                    }`}
                  >
                    {tool.name}
                  </h2>
                  <p
                    className={`text-xs mb-4 leading-relaxed ${
                      tool.isPlaceholder ? "text-gray-500" : "text-gray-600"
                    }`}
                  >
                    {tool.description}
                  </p>

                  {tool.isPlaceholder ? (
                    <a
                      href={tool.link}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-800"
                    >
                      Suggest something else
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link
                      href={tool.link}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      Open tool
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* FEEDBACK + SUPPORT */}
          <section
            id="feedback"
            className="bg-white border border-gray-300 grid grid-cols-1 md:grid-cols-[1.2fr,0.8fr]"
          >
            {/* feedback form */}
            <div className="border-b md:border-b-0 md:border-r border-gray-300 p-6 md:p-7">
              <div className="flex items-center gap-2 mb-4">
                <Send className="w-4 h-4 text-gray-700" />
                <h2 className="text-sm font-semibold tracking-tight">Feedback</h2>
              </div>
              <p className="text-xs text-gray-600 mb-4">Give me feedback or suggest new tools to build.</p>

              <form onSubmit={handleInternalFormSubmit} className="space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <label htmlFor="tool" className="text-xs font-medium tracking-tight">
                    Tool
                  </label>
                  <select
                    id="tool"
                    name="tool"
                    className="border border-gray-300 bg-gray-50 px-2 py-2 text-xs focus:outline-none"
                    defaultValue="Opioid Regimen Builder"
                  >
                    <option>Opioid Regimen Builder</option>
                    <option>Hyponatremia Calculator</option>
                    <option>General website / new tool idea</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="message" className="text-xs font-medium tracking-tight">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="border border-gray-300 bg-gray-50 px-2 py-2 text-xs focus:outline-none resize-y"
                    placeholder="Describe the issue or idea..."
                  />
                </div>

                {submitStatus === "success" ? (
                  <div className="bg-green-100 border border-green-200 text-green-800 text-xs px-3 py-2">
                    Thanks — got it.
                  </div>
                ) : submitStatus === "error" ? (
                  <div className="bg-red-100 border border-red-200 text-red-800 text-xs px-3 py-2">
                    Something went wrong. Try again.
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="bg-black text-white text-xs px-4 py-2 tracking-tight"
                  >
                    Submit
                  </button>
                )}
              </form>
            </div>
          {/* support */}
<div id="support" className="p-6 md:p-7">
  <div className="flex items-center gap-2 mb-4">
    <Heart className="w-4 h-4 text-gray-700" />
    <h2 className="text-sm font-semibold tracking-tight">Support notomed</h2>
  </div>
  <p className="text-xs text-gray-700 mb-4">
    All applications were built after hours and took significant time and determination to make.
    If they save you time or help in anyway, you can support it here.
  </p>

  {/* put form + contact button in the SAME row */}
  <div className="flex flex-wrap items-center gap-3">
    {/* your custom-amount form stays the same */}
    <form
      onSubmit={handleSupportSubmit}
      className="flex flex-wrap items-center gap-2"
    >
      <label className="text-xs text-gray-600" htmlFor="amount">
        Amount (USD)
      </label>
      <input
        id="amount"
        type="number"
        min="1"
        step="1"
        value={supportAmount}
        onChange={(e) => setSupportAmount(e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1 text-sm w-24"
      />
      <button
        type="submit"
        disabled={supportLoading}
        className="bg-green-600 text-white text-xs px-4 py-2 inline-flex items-center gap-2 disabled:opacity-60 rounded-md"
      >
        <Heart className="w-3 h-3" />
        {supportLoading ? "Redirecting..." : "Support"}
      </button>
    </form>

    {/* contact button stays a separate link, just in same flex row */}
    <Link
      href={`mailto:${CONFIG.contactEmail}`}
      className="bg-blue-600 text-white text-xs px-4 py-2 inline-flex items-center gap-2 rounded-md"
    >
      <Mail className="w-3 h-3" />
      Contact Me!
    </Link>
  </div>
</div>
          </section>
        </main>
      </div>
    </>
  );
} 