// src/components/AccordionStep.tsx

import React from "react";
import { ChevronDown, Check } from "lucide-react";

interface AccordionStepProps {
  step: number;
  title: string;
  subTitle: string;
  isOpen: boolean;
  onToggle: () => void;
  isComplete: boolean;
  children: React.ReactNode;
}

const statusClasses = {
  complete:
    "bg-[color:rgba(210,126,88,0.2)] text-[color:var(--accent)] border border-[color:rgba(210,126,88,0.35)]",
  incomplete:
    "bg-[color:rgba(67,84,71,0.35)] text-[color:var(--tool-panel-header-subtext-current)] border border-[color:rgba(122,137,123,0.35)]",
};

export function AccordionStep({
  step,
  title,
  subTitle,
  isOpen,
  onToggle,
  isComplete,
  children,
}: AccordionStepProps) {
  const currentStatus = isComplete ? "complete" : "incomplete";

  return (
    <div
      className={`rounded-2xl border bg-white/95 shadow-lg transition-all duration-300 overflow-hidden ${
        isOpen
          ? 'border-[color:var(--tool-panel-header-border-current)] shadow-[0_18px_50px_rgba(12,18,15,0.35)]'
          : 'border-[color:var(--tool-panel-header-border-current)]'
      }`}
    >
      {/* HEADER */}
      <button
        onClick={onToggle}
        className={`tool-module-header w-full flex items-center justify-between p-6 transition-colors duration-200 ${
          isOpen ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : ''
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center text-left">
          {/* STEP NUMBER & STATUS */}
          <div
            className={`mr-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${statusClasses[currentStatus]}`}
          >
            {isComplete ? <Check size={18} /> : step}
          </div>

          <div>
            <h2 className="tool-module-title text-lg font-semibold">{title}</h2>
            <p className="tool-module-subtext mt-0.5 text-sm">{subTitle}</p>
          </div>
        </div>

        {/* TOGGLE ICON */}
        <ChevronDown
          className={`h-5 w-5 text-[color:var(--tool-panel-header-subtext-current)] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* CONTENT */}
      {/* Only render content if it's open */}
      {isOpen && <div className="border-t border-gray-100 bg-white/95 p-6 pt-4">{children}</div>}
    </div>
  );
}