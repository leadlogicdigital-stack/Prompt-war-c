"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, X, ChevronDown } from "lucide-react";
import { useSukoon } from "@/lib/store";
import { HelplineCard } from "@/components/safety/HelplineCard";
import { useVoiceSession, careVars } from "@/lib/voice/useVoiceSession";

const BREATH = [
  { label: "Breathe in", secs: 4, scale: 1.18 },
  { label: "Hold", secs: 2, scale: 1.18 },
  { label: "Breathe out", secs: 6, scale: 0.7 },
] as const;

export function SosOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useSukoon();
  const cp = state.careProfile;
  const { mode, error, start, end } = useVoiceSession();
  const started = useRef(false);
  const [phase, setPhase] = useState(0);
  const [showHelplines, setShowHelplines] = useState(false);

  // auto-start the voice agent in SOS mode, once per open
  useEffect(() => {
    if (open && !started.current) {
      started.current = true;
      setShowHelplines(false);
      start({
        ...careVars(cp),
        situation:
          "an SOS moment — they just tapped the calm-me-down button during anxiety or panic",
        opening_line:
          "You're safe. Let's breathe together — in slowly through your nose… and out, even slower. I'm right here, I'm not going anywhere.",
      });
    }
    if (!open) started.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // continuous breathing guide (runs regardless of voice state)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setPhase((p) => (p + 1) % BREATH.length), BREATH[phase].secs * 1000);
    return () => clearTimeout(t);
  }, [open, phase]);

  function close() {
    end();
    onClose();
  }

  const cur = BREATH[phase];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col items-center overflow-y-auto bg-ink/70 px-5 py-8 backdrop-blur-xl"
        >
          <button
            onClick={close}
            aria-label="Close"
            className="absolute right-5 top-5 text-white/70 transition-colors hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>

          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
            You&apos;re going to be okay
          </p>
          <h2 className="mt-2 text-center font-display text-2xl font-semibold text-white">
            I&apos;m right here with you{cp?.identity.nickname ? `, ${cp.identity.nickname}` : ""}.
          </h2>

          {/* breathing guide */}
          <div className="relative my-auto grid h-72 w-72 place-items-center">
            <motion.div
              className="absolute h-72 w-72 rounded-full blur-2xl"
              style={{ backgroundImage: "linear-gradient(135deg, rgb(99 76 196), rgb(38 192 176))" }}
              animate={{ scale: cur.scale, opacity: 0.35 }}
              transition={{ duration: cur.secs, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute h-56 w-56 rounded-full"
              style={{ backgroundImage: "linear-gradient(135deg, rgb(99 76 196), rgb(38 192 176))" }}
              animate={{ scale: cur.scale }}
              transition={{ duration: cur.secs, ease: "easeInOut" }}
            />
            <div className="relative z-10 text-center">
              <p className="font-display text-3xl font-semibold text-white drop-shadow">{cur.label}</p>
              <p className="mt-1 text-sm text-white/70">
                {mode === "speaking"
                  ? "Sukoon is with you…"
                  : mode === "connecting"
                    ? "Calling Sukoon…"
                    : mode === "listening"
                      ? "Just follow the circle"
                      : "Follow the circle"}
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-4 max-w-sm text-center text-sm text-white/80">
              Couldn&apos;t start the voice call — but I&apos;m still here. Breathe with the circle,
              and reach a real person below if you need one.
            </p>
          )}

          {/* helpline — always one tap away */}
          <div className="w-full max-w-sm space-y-3">
            <a
              href="tel:14416"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-bold text-alert shadow-lift"
            >
              <Phone className="h-5 w-5" /> Call Tele-MANAS · 14416
            </a>

            <button
              onClick={() => setShowHelplines((s) => !s)}
              className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-white/70 hover:text-white"
            >
              More helplines
              <ChevronDown className={`h-4 w-4 transition-transform ${showHelplines ? "rotate-180" : ""}`} />
            </button>
            {showHelplines && <HelplineCard />}

            <button
              onClick={close}
              className="w-full rounded-2xl border border-white/30 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              I&apos;m feeling steadier now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
