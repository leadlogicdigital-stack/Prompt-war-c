"use client";

import { cn } from "@/lib/utils";

interface Props {
  label: string;
  prompt?: string;
  low: string;
  high: string;
  value: number;
  hue: string; // rgb triplet
  onChange: (v: number) => void;
  compact?: boolean;
}

export function Slider({ label, prompt, low, high, value, hue, onChange, compact }: Props) {
  return (
    <div className={cn("select-none", compact ? "py-1.5" : "py-2")}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div>
          <span className={cn("font-semibold text-ink", compact ? "text-sm" : "text-[15px]")}>
            {label}
          </span>
          {prompt && !compact && (
            <p className="mt-0.5 text-sm text-muted">{prompt}</p>
          )}
        </div>
        <span
          className="tabular-nums text-sm font-bold"
          style={{ color: `rgb(${hue})` }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mood-slider"
        style={
          {
            "--fill": `${value}%`,
            "--accent-c": hue,
          } as React.CSSProperties
        }
      />
      <div className="mt-1.5 flex justify-between text-xs text-faint">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
