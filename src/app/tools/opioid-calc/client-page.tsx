// src/app/page.tsx  (or wherever you're keeping the opioid tool)
"use client";

import React, { useState } from "react";
import ToolPageShell from "@/components/ToolPageShell";
import { RegimenProvider, useRegimenContext } from "@/context/RegimenContext";
import { HomeRegimenInput } from "@/components/HomeRegimenInput";
import { PRNSuggestionTable } from "@/components/PRNSuggestionTable";
import { RegimenSummary } from "@/components/RegimenSummary";
import { QuickConvert } from "@/components/QuickConvert";
import { Switch } from "@/components/ui/Switch";
import { AccordionStep } from "@/components/AccordionStep";
import { BackButton } from "@/components/BackButton";
import { ChevronRight } from "lucide-react";

// =========================================================
// Opioid Regimen Builder - v5.0.0 (UX Rework)
// =========================================================

function AppContent() {
  const { ome, opioidNaive } = useRegimenContext();
  const [activeStep, setActiveStep] = useState(1);
  const [showQuick, setShowQuick] = useState(false);
  const toggleQuick = () => setShowQuick((prev) => !prev);
  const handleQuickKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleQuick();
    }
  };

  // Logic to determine if a step is complete (gates the next step)
  const isStep1Complete = opioidNaive || ome > 0;
  const isStep2Complete = isStep1Complete;

  return (
    <div className="space-y-4">
      {/* 1. Home Regimen (Step 1) */}
      <AccordionStep
        step={1}
        title="1. Patient's Home Opioid Regimen"
        subTitle={`Enter all scheduled (ER/LA) and PRN home medications. Current OME: ~${Math.round(
          ome
        )} mg/day.`}
        isOpen={activeStep === 1}
        onToggle={() => setActiveStep(activeStep === 1 ? 0 : 1)}
        isComplete={isStep1Complete}
      >
        <HomeRegimenInput />
      </AccordionStep>

      {/* 2. Inpatient Regimen Builder (Step 2) */}
      <AccordionStep
        step={2}
        title="2. Build Inpatient PRN & Multimodal Plan"
        subTitle="Select PRN opioid, route, and frequency. Add adjunctive medications."
        isOpen={activeStep === 2 && isStep1Complete}
        onToggle={() => isStep1Complete && setActiveStep(activeStep === 2 ? 0 : 2)}
        isComplete={isStep2Complete}
      >
        <PRNSuggestionTable />
      </AccordionStep>

      {/* Locked State for Step 2 */}
      {!isStep1Complete && (
        <div className="p-6 bg-gray-100 rounded-xl text-gray-500 flex items-center gap-2">
          <ChevronRight size={18} />
          <span>Step 2 Locked: Complete Step 1 or check &quot;Opioid-naïve&quot; to continue.</span>
        </div>
      )}

      {/* 3. Final Summary (Step 3) */}
      {isStep2Complete && (
        <AccordionStep
          step={3}
          title="3. Final Assessment & Plan Summary"
          subTitle="Review the complete order set and copy for easy documentation."
          isOpen={activeStep === 3}
          onToggle={() => setActiveStep(activeStep === 3 ? 0 : 3)}
          isComplete={isStep2Complete}
        >
          <RegimenSummary />
        </AccordionStep>
      )}

      {/* Quick Converter - Secondary Tool */}
      <div
        className={`rounded-2xl border bg-white/95 shadow-sm overflow-hidden transition-all duration-300 ${
          showQuick
            ? "border-[color:var(--tool-panel-header-border)] shadow-[0_18px_50px_rgba(12,18,15,0.35)]"
            : "border-[#d7e0d4]"
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={showQuick}
          onClick={toggleQuick}
          onKeyDown={handleQuickKeyDown}
          className="tool-module-header flex items-center justify-between px-6 py-5 cursor-pointer"
        >
          <div>
            <h3 className="tool-module-title text-lg font-semibold">Quick Opioid-to-Opioid Converter</h3>
            <p className="tool-module-subtext mt-0.5 text-sm">
              Lightweight panel for one-off opioid conversions.
            </p>
          </div>
          <Switch checked={showQuick} onChange={setShowQuick} />
        </div>

        {showQuick && (
          <div className="border-t border-gray-100 bg-white/95 p-6 pt-4">
            <QuickConvert />
          </div>
        )}
      </div>
    </div>
  );
}

export default function OpioidConversionPage() {
  return (
    <RegimenProvider>
      <ToolPageShell
        title="Opioid Conversion & Regimen Builder"
        eyebrow="Analgesia"
        description={
          <p>A clinical tool for calculating opioid conversions and building pain regimens for hospitalized adults.</p>
        }
        footnote={
          <p>
            This tool does not replace clinical judgement and is meant to assist in decision-making. Always verify calculations
            and consider patient-specific factors.
          </p>
        }
        bodyClassName="space-y-6"
      >
        <AppContent />
      </ToolPageShell>
    </RegimenProvider>
  );
}

