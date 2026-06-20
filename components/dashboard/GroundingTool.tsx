"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { ToolShell } from "./ToolShell";

const STEPS = [
  { n: 5, verb: "can see", emoji: "👀", hue: "99 76 196" },
  { n: 4, verb: "can hear", emoji: "👂", hue: "122 150 235" },
  { n: 3, verb: "can feel or touch", emoji: "✋", hue: "38 192 176" },
  { n: 2, verb: "can smell", emoji: "👃", hue: "244 158 120" },
  { n: 1, verb: "can taste, or one slow breath", emoji: "🫧", hue: "162 130 230" },
];

export function GroundingTool({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setI(0);
      setDone(false);
    }
  }, [open]);

  const step = STEPS[i];

  function next() {
    if (i < STEPS.length - 1) setI(i + 1);
    else setDone(true);
  }
  function finish() {
    onComplete();
    onClose();
  }

  return (
    <ToolShell open={open} onClose={onClose} label="Grounding · 5-4-3-2-1">
      {!done ? (
        <div className="text-center">
          <div className="mb-2 flex justify-center gap-1.5">
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className="h-1.5 w-6 rounded-full transition-colors"
                style={{ background: idx <= i ? "rgb(99 76 196)" : "rgb(232 228 250)" }}
              />
            ))}
          </div>
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div
              className="mx-auto mt-6 grid h-24 w-24 place-items-center rounded-full text-5xl"
              style={{ background: `rgb(${step.hue} / 0.12)` }}
            >
              {step.emoji}
            </div>
            <p className="mt-5 font-display text-2xl font-semibold text-ink">
              Name <span style={{ color: `rgb(${step.hue})` }}>{step.n}</span> thing
              {step.n > 1 ? "s" : ""} you {step.verb}.
            </p>
            <p className="mt-2 text-sm text-muted">
              Slowly — out loud or in your head. There&apos;s no rush.
            </p>
          </motion.div>
          <button onClick={next} className="btn-primary mt-7 w-full">
            {i < STEPS.length - 1 ? (
              <>
                Next <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              "Almost there"
            )}
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-good/15 text-4xl">
            🤍
          </div>
          <h3 className="mt-4 font-display text-2xl font-semibold text-ink">
            You&apos;re back in the room.
          </h3>
          <p className="mt-2 text-sm text-muted">
            Notice your feet on the floor and your breath. You&apos;re safe right now.
          </p>
          <button onClick={finish} className="btn-primary mt-6 w-full">
            <Check className="h-4 w-4" /> Done
          </button>
        </div>
      )}
    </ToolShell>
  );
}
