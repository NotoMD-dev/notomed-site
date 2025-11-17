// src/components/QuickConvert.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Opioid, Route } from "../types";
import {
  OPIOID_LABELS,
  ROUTE_LABELS,
  ALLOWED_ROUTES,
} from "../utils/constants";
import {
  quickConvertWithSteps,
  copyToClipboard,
} from "../utils/conversionLogic";

const FREQ_OPTIONS = [2, 3, 4, 6, 8, 12];
const numberInputClass =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900 placeholder:text-gray-500 caret-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-200";

export function QuickConvert() {
  // FROM side
  const [fromDrug, setFromDrug] = useState<Opioid>("morphine");
  const [fromRoute, setFromRoute] = useState<Route>("oral");
  const [fromDose, setFromDose] = useState<number>(30);
  const [includeFreq, setIncludeFreq] = useState<boolean>(false);
  const [fromFreq, setFromFreq] = useState<number>(6);

  // TO side
  const [toDrug, setToDrug] = useState<Opioid>("hydromorphone");
  const [toRoute, setToRoute] = useState<Route>("oral");
  const [toFreq, setToFreq] = useState<number>(6);

  // cross-tolerance
  const [crossTol, setCrossTol] = useState<number>(0);

  // allowed routes
  const allowedFromRoutes = useMemo(
    () => ALLOWED_ROUTES[fromDrug] || ["oral"],
    [fromDrug]
  );
  const allowedToRoutes = useMemo(
    () => ALLOWED_ROUTES[toDrug] || ["oral"],
    [toDrug]
  );

  // keep fromRoute sane
  React.useEffect(() => {
    if (!allowedFromRoutes.includes(fromRoute)) {
      setFromRoute(allowedFromRoutes[0]);
    }
  }, [fromRoute, allowedFromRoutes]);

  // keep toRoute sane
  React.useEffect(() => {
    if (!allowedToRoutes.includes(toRoute)) {
      setToRoute(allowedToRoutes[0]);
    }
  }, [toRoute, allowedToRoutes]);

  const result = useMemo(() => {
    if (!fromDose || fromDose <= 0) return null;
    return quickConvertWithSteps(
      {
        drug: fromDrug,
        route: fromRoute,
        perDoseMg: fromDose,
        freqHours: includeFreq ? fromFreq : undefined,
      },
      {
        drug: toDrug,
        route: toRoute,
        targetFreqHours: includeFreq ? toFreq : undefined,
      },
      {
        includeFreq,
        crossTolerancePct: crossTol || 0,
      }
    );
  }, [
    fromDrug,
    fromRoute,
    fromDose,
    includeFreq,
    fromFreq,
    toDrug,
    toRoute,
    toFreq,
    crossTol,
  ]);

  return (
    <section className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Quick Opioid-to-Opioid Converter
        </h3>
        {/* no inner toggle here on purpose */}
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Convert a per-dose regimen by first normalizing to total daily opioid,
        then converting to the target opioid. Apply cross-tolerance if needed.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* FROM card */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-3">From</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Drug</label>
              <select
                className="mt-1 w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900"
                value={fromDrug}
                onChange={(e) => setFromDrug(e.target.value as Opioid)}
              >
                {Object.keys(OPIOID_LABELS).map((k) => (
                  <option key={k} value={k}>
                    {OPIOID_LABELS[k as Opioid]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Route</label>
              <select
                className="mt-1 w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900"
                value={fromRoute}
                onChange={(e) => setFromRoute(e.target.value as Route)}
              >
                {allowedFromRoutes.map((rt) => (
                  <option key={rt} value={rt}>
                    {ROUTE_LABELS[rt]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium text-gray-500">
              Total daily dose or per-dose amount
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={0.1}
                className={`flex-1 ${numberInputClass}`}
                value={fromDose}
                onChange={(e) => setFromDose(Number(e.target.value) || 0)}
                style={{ WebkitTextFillColor: "#111827" }}
              />
              <span className="text-xs text-gray-500">mg</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              id="includeFreq"
              type="checkbox"
              checked={includeFreq}
              onChange={(e) => setIncludeFreq(e.target.checked)}
              className="rounded border-[#d7e0d4] text-[#3f6b53] focus:ring-[#c1d1c3]"
            />
            <label
              htmlFor="includeFreq"
              className="text-xs text-gray-700 select-none"
            >
              Include frequency
            </label>
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium text-gray-500">
              Freq (qH)
            </label>
            <select
              className={`mt-1 w-full h-9 rounded-lg border px-2 text-sm text-gray-900 ${
                includeFreq
                  ? "bg-white border-gray-200"
                  : "bg-gray-100 border-gray-100 text-gray-400"
              }`}
              value={fromFreq}
              onChange={(e) => setFromFreq(Number(e.target.value))}
              disabled={!includeFreq}
            >
              {FREQ_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  q{h}h
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">
              Cross-tolerance reduction (%)
            </label>
            <input
              type="number"
              className={`mt-1 ${numberInputClass}`}
              value={crossTol}
              onChange={(e) => setCrossTol(Number(e.target.value) || 0)}
              style={{ WebkitTextFillColor: "#111827" }}
            />
          </div>
        </div>

        {/* TO card */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-3">To</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Drug</label>
              <select
                className="mt-1 w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900"
                value={toDrug}
                onChange={(e) => setToDrug(e.target.value as Opioid)}
              >
                {Object.keys(OPIOID_LABELS).map((k) => (
                  <option key={k} value={k}>
                    {OPIOID_LABELS[k as Opioid]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Route</label>
              <select
                className="mt-1 w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900"
                value={toRoute}
                onChange={(e) => setToRoute(e.target.value as Route)}
              >
                {allowedToRoutes.map((rt) => (
                  <option key={rt} value={rt}>
                    {ROUTE_LABELS[rt]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {includeFreq && (
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-500">
                Target freq (qH)
              </label>
              <select
                className="mt-1 w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900"
                value={toFreq}
                onChange={(e) => setToFreq(Number(e.target.value))}
              >
                {FREQ_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    q{h}h
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-3">
            <div className="rounded-xl border border-[color:var(--hero-tone-pear-border)] bg-[color:var(--hero-tone-pear-surface)] px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-[color:var(--hero-tone-pear-title)] font-mono text-sm truncate">
                {result ? result.displayText : "—"}
              </p>
              <button
                type="button"
                onClick={async () => {
                  if (!result) return;
                  try {
                    await copyToClipboard(result.displayText);
                  } catch (error) {
                    console.error("Clipboard copy failed", error);
                    alert("Could not copy to clipboard. Please copy manually.");
                  }
                }}
                className="text-xs font-semibold text-[#2f4c3d] hover:text-[#1f362c] disabled:text-[#a4ae9f]"
                disabled={!result}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {result && result.steps && result.steps.length > 0 && (
        <div className="mt-6 bg-gray-50 border border-gray-100 rounded-xl p-4">
          <details open>
            <summary className="text-sm font-semibold text-gray-800 cursor-pointer">
              Show calculation steps
            </summary>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {result.steps.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </section>
  );
}
