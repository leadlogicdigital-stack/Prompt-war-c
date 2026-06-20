"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const PHASES = [
  { label: "Breathe in", secs: 4, scale: 1.0 },
  { label: "Hold", secs: 4, scale: 1.0 },
  { label: "Breathe out", secs: 6, scale: 0.55 },
  { label: "Rest", secs: 2, scale: 0.55 },
] as const;

export function BreathingTool({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState(0);
  const [rounds, setRounds] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase(0);
    setRounds(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const cur = PHASES[phase];
    timer.current = setTimeout(() => {
      const next = (phase + 1) % PHASES.length;
      if (next === 0) {
        const r = rounds + 1;
        setRounds(r);
        if (r >= 4) {
          onComplete();
          onClose();
          return;
        }
      }
      setPhase(next);
    }, cur.secs * 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open, phase, rounds, onClose, onComplete]);

  const cur = PHASES[phase];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative mx-5 flex w-full max-w-sm flex-col items-center rounded-3xl bg-surface p-8 shadow-lift"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-faint hover:text-ink"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <p className="mb-8 text-sm font-medium text-muted">
              Round {rounds + 1} of 4 · follow the circle
            </p>

            <div className="relative grid h-56 w-56 place-items-center">
              <motion.div
                className="absolute h-56 w-56 rounded-full"
                style={{ backgroundImage: "linear-gradient(135deg, rgb(99 76 196), rgb(38 192 176))" }}
                animate={{ scale: cur.scale, opacity: 0.18 }}
                transition={{ duration: cur.secs, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute h-40 w-40 rounded-full"
                style={{ backgroundImage: "linear-gradient(135deg, rgb(99 76 196), rgb(38 192 176))" }}
                animate={{ scale: cur.scale }}
                transition={{ duration: cur.secs, ease: "easeInOut" }}
              />
              <span className="relative z-10 font-display text-2xl font-semibold text-white drop-shadow">
                {cur.label}
              </span>
            </div>

            <p className="mt-8 text-center text-sm text-muted">
              You're doing great. Let your shoulders drop.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
