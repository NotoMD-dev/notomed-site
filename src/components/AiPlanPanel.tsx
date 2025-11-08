"use client";

import { useEffect, useMemo, useState } from "react";
import type { StructuredData } from "@/lib/getAIPlan";

const SECURE_CTX =
  typeof window !== "undefined" &&
  (window.isSecureContext || window.location.hostname === "localhost");

export default function AiPlanPanel({
  getData,
}: {
  getData: () => StructuredData;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const data = useMemo(() => getData(), [getData]);

  useEffect(() => setCopied(false), [text]);

  async function copyToClipboard(payload: string) {
    try {
      if (SECURE_CTX && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const ta = document.createElement("textarea");
        ta.value = payload;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
    } catch {
      setCopied(false);
      alert("Could not copy to clipboard. Please copy manually.");
    }
  }

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch("/api/ai-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || "LLM error");
      setText(json.fullText || "");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate plan";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">AI Assessment &amp; Plan</h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3 py-2 rounded-xl border text-slate-800"
        >
          {loading ? "Generating…" : "Generate AI Plan"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl mb-3">
          {error}
        </div>
      )}

      {!text && !loading && !error && (
        <p className="text-sm text-slate-800">
          Click “Generate AI Plan” to produce an evidence-based A/P written by the model in your format.
        </p>
      )}

      {!!text && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-600">ai-authored — severity-aware</div>
            <button
              type="button"
              className="text-xs rounded-lg border px-2 py-1"
              onClick={() => copyToClipboard(text)}
              disabled={!text}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 border rounded-xl p-3">
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}
