"use client";

import { Phone, Heart } from "lucide-react";
import { HELPLINES } from "@/lib/safety/helplines";

export function HelplineCard({ compact = false }: { compact?: boolean }) {
  const list = compact ? HELPLINES.slice(0, 3) : HELPLINES;
  return (
    <div className="rounded-2xl border border-alert/30 bg-alert/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-alert/15 text-alert">
          <Heart className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-ink">
          You're not alone — talk to someone now
        </p>
      </div>
      <div className="space-y-2">
        {list.map((h) => (
          <a
            key={h.name}
            href={`tel:${h.tel}`}
            className="flex items-center justify-between gap-3 rounded-xl bg-surface/80 px-3 py-2.5 transition-colors hover:bg-surface"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{h.name}</p>
              <p className="truncate text-xs text-muted">
                {h.hours}
                {h.languages ? ` · ${h.languages}` : ""}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-alert/10 px-3 py-1 text-sm font-bold text-alert">
              <Phone className="h-3.5 w-3.5" />
              {h.number}
            </span>
          </a>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Sukoon is a companion, not a substitute for professional care. If you're in
        immediate danger, please call your local emergency number.
      </p>
    </div>
  );
}
