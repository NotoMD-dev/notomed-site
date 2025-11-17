
import { useEffect, useState } from "react";
import type { StructuredData } from "@/lib/getAIPlan";
import type { PreopAIRequest } from "@/types/preop";

const SECURE_CTX =
  typeof window !== "undefined" &&
  (window.isSecureContext || window.location.hostname === "localhost");

type AiPlanPayload = StructuredData | PreopAIRequest;

interface AiPlanPanelProps {
  getData: () => AiPlanPayload;
  onText?: (text: string) => void;
}

interface AiPlanErrorResponse {
  error: string;
}

interface AiPlanSuccessResponse {
  fullText?: string;
  computed?: unknown;
}

function isAiPlanErrorResponse(value: unknown): value is AiPlanErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { error?: unknown }).error === "string"
  );
}

function isAiPlanSuccessResponse(
  value: unknown
): value is AiPlanSuccessResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    ("fullText" in value || "computed" in value)
  );
}

export default function AiPlanPanel({
  getData,
  onText,
}: AiPlanPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [copied, setCopied] = useState(false);

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
      const data = getData(); // payload from the pre-op tool
  
      const resp = await fetch("/api/ai-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
  
      // Read raw text first so we can handle non-JSON responses gracefully
      const raw = await resp.text();
  
      let json: unknown = null;
      if (raw) {
        try {
          json = JSON.parse(raw) as unknown;
        } catch (parseErr) {
          console.error("Failed to parse /api/ai-plan JSON:", parseErr, raw);
          throw new Error(
            raw || "Non-JSON response from /api/ai-plan (see console)."
          );
        }
      }

      if (!resp.ok) {
        const messageFromServer = isAiPlanErrorResponse(json)
          ? json.error
          : raw || `LLM error (${resp.status})`;
        throw new Error(messageFromServer);
      }

      const full = isAiPlanSuccessResponse(json) && typeof json.fullText === "string"
        ? json.fullText
        : "";
      setText(full);
      if (onText) onText(full);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate plan";
      setError(message);
    } finally {
      setLoading(false);
    }
  }  
  

  return (
    <div className="rounded-2xl border border-[color:var(--hero-tone-pear-border)] bg-[color:var(--hero-tone-pear-surface)] p-4 sm:p-5 shadow-[0_25px_65px_-35px_rgba(58,47,34,0.55)] text-[color:var(--hero-tone-pear-title)]">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="text-lg font-semibold tracking-tight">AI Assessment &amp; Plan</h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3 py-2 rounded-xl border border-[color:var(--hero-tone-pear-border)] bg-white/90 text-[color:var(--hero-tone-pear-title)] text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#eadfcd] focus:ring-offset-1 disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate AI Plan"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-[#7a1f2c] bg-[#fdecef] border border-[#f0d7dd] p-3 rounded-xl mb-3">
          {error}
        </div>
      )}

      {!text && !loading && !error && (
        <p className="text-sm text-[color:var(--hero-tone-pear-body)]">
          Click “Generate AI Plan” to produce an evidence-based A/P written by the model in your format.
        </p>
      )}

      {!!text && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[color:var(--hero-tone-pear-muted)] uppercase tracking-wide">
              ai-authored — severity-aware
            </div>
            <button
              type="button"
              className="text-xs rounded-lg border border-[color:var(--hero-tone-pear-border)] px-3 py-1 font-semibold text-[color:var(--hero-tone-pear-title)] bg-white/80 hover:bg-white transition"
              onClick={() => copyToClipboard(text)}
              disabled={!text}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm bg-white border border-[color:var(--hero-tone-pear-border)] rounded-xl p-3 text-[color:var(--hero-tone-pear-title)]">
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}
