
import { useEffect, useState } from "react";
import type { StructuredData } from "@/lib/getAIPlan";
import type { PreopAIRequest } from "@/types/preop";

const SECURE_CTX =
  typeof window !== "undefined" &&
  (window.isSecureContext || window.location.hostname === "localhost");

type AiPlanPayload = StructuredData | PreopAIRequest;

type AiPlanPanelVariant = "sage" | "classic";

interface AiPlanPanelProps {
  getData: () => AiPlanPayload;
  onText?: (text: string) => void;
  variant?: AiPlanPanelVariant;
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

const palette = {
  sage: {
    container:
      "rounded-2xl border border-[color:var(--hero-tone-sage-border)] bg-[color:var(--hero-tone-sage-surface)] p-4 sm:p-5 shadow-[0_25px_65px_-35px_rgba(15,25,19,0.4)] text-[color:var(--hero-tone-sage-title)]",
    button:
      "px-3 py-2 rounded-xl border border-[color:var(--hero-tone-sage-border)] bg-white/90 text-[color:var(--hero-tone-sage-title)] text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[color:var(--hero-tone-sage-border)] focus:ring-offset-1 disabled:opacity-60",
    helper: "text-sm text-[color:var(--hero-tone-sage-body)]",
    badge: "text-xs text-[color:var(--hero-tone-sage-muted)] uppercase tracking-wide",
    copy:
      "text-xs rounded-lg border border-[color:var(--hero-tone-sage-border)] px-3 py-1 font-semibold text-[color:var(--hero-tone-sage-title)] bg-white/90 hover:bg-white transition",
    pre:
      "whitespace-pre-wrap text-sm bg-white border border-[color:var(--hero-tone-sage-border)] rounded-xl p-3 text-[color:var(--hero-tone-sage-title)]",
  },
  classic: {
    container:
      "rounded-2xl border border-[#d7e0d4]/90 bg-[#eef2ed] p-4 sm:p-5 shadow-[0_18px_45px_-32px_rgba(79,70,229,0.25)] text-[#1f2d23]",
    button:
      "px-3 py-2 rounded-xl border border-[#c7d8c7] bg-white text-[#355a45] text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#c7d8c7] focus:ring-offset-1 disabled:opacity-60",
    helper: "text-sm text-[#425446]",
    badge: "text-xs text-[#5d7d6a] uppercase tracking-wide",
    copy:
      "text-xs rounded-lg border border-[#c7d8c7] px-3 py-1 font-semibold text-[#355a45] bg-white hover:bg-[#f5f8f5] transition",
    pre:
      "whitespace-pre-wrap text-sm bg-white border border-[#c7d8c7] rounded-xl p-3 text-[#2f4c3d]",
  },
} as const;

export default function AiPlanPanel({
  getData,
  onText,
  variant = "sage",
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
    <div className={palette[variant].container}>
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="text-lg font-semibold tracking-tight">AI Assessment &amp; Plan</h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={palette[variant].button}
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
        <p className={palette[variant].helper}>
          Click “Generate AI Plan” to produce an evidence-based A/P written by the model in your format.
        </p>
      )}

      {!!text && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className={palette[variant].badge}>
              ai-authored — severity-aware
            </div>
            <button
              type="button"
              className={palette[variant].copy}
              onClick={() => copyToClipboard(text)}
              disabled={!text}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className={palette[variant].pre}>
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}
