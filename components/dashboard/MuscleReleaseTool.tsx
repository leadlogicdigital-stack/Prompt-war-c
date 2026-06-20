"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ToolShell } from "./ToolShell";

const GROUPS = [
  "your hands — clench into fists",
  "your arms — pull them in tight",
  "your shoulders — lift them to your ears",
  "your face — scrunch your jaw and eyes",
  "your belly — tighten your core",
  "your legs & feet — press down, curl your toes",
];
const TENSE = 5;
const RELEASE = 8;

export function MuscleReleaseTool({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [gi, setGi] = useState(0);
  const [phase, setPhase] = useState<"tense" | "release">("tense");
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setGi(0);
      setPhase("tense");
      setDone(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || done) return;
    const secs = phase === "tense" ? TENSE : RELEASE;
    timer.current = setTimeout(() => {
      if (phase === "tense") {
        setPhase("release");
      } else if (gi < GROUPS.length - 1) {
        setGi(gi + 1);
        setPhase("tense");
      } else {
        setDone(true);
      }
    }, secs * 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open, done, phase, gi]);

  function finish() {
    onComplete();
    onClose();
  }

  const secs = phase === "tense" ? TENSE : RELEASE;

  return (
    <ToolShell open={open} onClose={onClose} label={`Muscle release · ${gi + 1}/${GROUPS.length}`}>
      {!done ? (
        <div className="text-center">
          <div className="relative mx-auto grid h-44 w-44 place-items-center">
            <motion.div
              key={`${gi}-${phase}`}
              className="absolute h-44 w-44 rounded-full"
              style={{ backgroundImage: "linear-gradient(135deg, rgb(99 76 196), rgb(38 192 176))" }}
              initial={{ scale: phase === "tense" ? 0.6 : 1.05, opacity: 0.28 }}
              animate={{
                scale: phase === "tense" ? 1.05 : 0.6,
                opacity: phase === "tense" ? 0.42 : 0.15,
              }}
              transition={{ duration: secs, ease: "easeInOut" }}
            />
            <div className="relative z-10">
              <p className="font-display text-3xl font-semibold text-ink">
                {phase === "tense" ? "Tense" : "Release"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {phase === "tense" ? "breathe in…" : "breathe out, let go…"}
              </p>
            </div>
          </div>
          <p className="mt-6 text-pretty text-lg text-ink">
            {phase === "tense" ? "Tighten " : "Soften "}
            <span className="font-semibold">{GROUPS[gi]}</span>
          </p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-good/15 text-4xl">
            🌿
          </div>
          <h3 className="mt-4 font-display text-2xl font-semibold text-ink">
            Your body&apos;s a little lighter.
          </h3>
          <p className="mt-2 text-sm text-muted">
            Carry that loosened feeling into the next hour of studying.
          </p>
          <button onClick={finish} className="btn-primary mt-6 w-full">
            <Check className="h-4 w-4" /> Done
          </button>
        </div>
      )}
    </ToolShell>
  );
}
