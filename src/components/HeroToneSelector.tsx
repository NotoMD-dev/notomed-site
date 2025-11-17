"use client";

import type { ToolHeroTone } from "./ToolPageShell";

const HERO_TONE_OPTIONS: ReadonlyArray<{
  id: ToolHeroTone;
  label: string;
  body: string;
  eyebrow: string;
}> = [
  {
    id: "sage",
    label: "Sage Mist",
    body: "Deep olive headers with muted green body copy.",
    eyebrow: "calming default",
  },
  {
    id: "pear",
    label: "Pearl Drift",
    body: "Olive text over a warm linen shell for charts-heavy tools.",
    eyebrow: "warm-neutral",
  },
  {
    id: "rose",
    label: "Rosewater",
    body: "Green headings paired with rose-muted supporting text.",
    eyebrow: "pink accent",
  },
  {
    id: "dusk",
    label: "Moss Dusk",
    body: "Darker evergreen text when you need extra contrast.",
    eyebrow: "high contrast",
  },
];

interface HeroToneSelectorProps {
  value: ToolHeroTone;
  onChange: (tone: ToolHeroTone) => void;
}

export function HeroToneSelector({ value, onChange }: HeroToneSelectorProps) {
  return (
    <aside className="rounded-2xl border border-[rgba(58,80,64,0.15)] bg-white/60 p-4 shadow-[0_12px_45px_rgba(15,22,18,0.25)]">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#5a665c]">
        Banner tone presets
      </p>
      <p className="mt-1 text-sm text-[#3a483d]">
        Preview lighter combos and click to update the hero. Every tool can reuse these tones.
      </p>

      <div className="mt-4 grid gap-3">
        {HERO_TONE_OPTIONS.map((tone) => {
          const active = tone.id === value;
          return (
            <button
              type="button"
              key={tone.id}
              onClick={() => onChange(tone.id)}
              className={`group w-full rounded-2xl border px-4 py-3 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                active
                  ? "border-[rgba(49,77,60,0.6)] shadow-[0_10px_28px_rgba(18,24,20,0.25)]"
                  : "border-transparent shadow-[0_6px_18px_rgba(18,24,20,0.15)] hover:border-[rgba(49,77,60,0.35)]"
              }`}
              style={{
                background: `var(--hero-tone-${tone.id}-surface)`,
              }}
            >
              <p
                className="text-[0.58rem] font-semibold uppercase tracking-[0.32em]"
                style={{ color: `var(--hero-tone-${tone.id}-muted)` }}
              >
                {tone.eyebrow}
              </p>
              <p
                className="mt-1 text-base font-semibold"
                style={{ color: `var(--hero-tone-${tone.id}-title)` }}
              >
                {tone.label}
              </p>
              <p
                className="mt-1 text-sm leading-snug"
                style={{ color: `var(--hero-tone-${tone.id}-body)` }}
              >
                {tone.body}
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs">
                <div
                  className="h-6 w-12 rounded-md border"
                  style={{
                    background: `var(--hero-tone-${tone.id}-surface)`,
                    borderColor: `var(--hero-tone-${tone.id}-border)`,
                  }}
                />
                <span
                  className="rounded-full px-2 py-1 text-[0.65rem] font-semibold"
                  style={{
                    background: active
                      ? `var(--hero-tone-${tone.id}-title)`
                      : `rgba(255,255,255,0.8)`,
                    color: active ? "#fefefe" : `var(--hero-tone-${tone.id}-title)`,
                    border: active ? "none" : `1px solid var(--hero-tone-${tone.id}-border)`,
                  }}
                >
                  {active ? "Active" : "Preview"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default HeroToneSelector;
