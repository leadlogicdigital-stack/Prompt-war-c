import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden>
      <defs>
        <linearGradient id="sukoon-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(99 76 196)" />
          <stop offset="100%" stopColor="rgb(38 192 176)" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="37" height="37" rx="12" fill="url(#sukoon-g)" />
      {/* a calm crescent / leaf — peace */}
      <path
        d="M27.5 11.5c-7 0.5-12 5.8-12 12.4 0 2.2 0.6 4 1.6 5.6-5-1.4-8.4-5.9-8.4-11.2 0-6.6 5.6-11.8 12.4-11.8 2.4 0 4.6 0.7 6.4 1z"
        fill="#fff"
        opacity="0.95"
      />
      <circle cx="26" cy="26" r="2.4" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export function Logo({ className, subtitle }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Mark />
      <div className="leading-none">
        <div className="font-display text-xl font-semibold tracking-tight text-ink">
          Sukoon
        </div>
        {subtitle && (
          <div className="mt-0.5 text-[11px] text-faint">your calm corner</div>
        )}
      </div>
    </div>
  );
}
