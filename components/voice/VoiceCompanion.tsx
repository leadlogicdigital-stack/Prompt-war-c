"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Loader2, Mic } from "lucide-react";
import { useSukoon } from "@/lib/store";
import { HelplineCard } from "@/components/safety/HelplineCard";
import { useVoiceSession, careVars, type VoiceMode } from "@/lib/voice/useVoiceSession";
import { cn } from "@/lib/utils";

const STATUS: Record<VoiceMode, string> = {
  idle: "Tap to talk with Sukoon",
  connecting: "Connecting you…",
  listening: "Listening — go ahead, I'm here",
  speaking: "Sukoon is speaking…",
  error: "Something went wrong",
};

export function VoiceCompanion() {
  const { state } = useSukoon();
  const cp = state.careProfile;
  const { mode, lines, crisis, error, start, end } = useVoiceSession();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines.length]);

  function callSukoon() {
    start({
      ...careVars(cp),
      situation: "a gentle check-in",
      opening_line: "Take a slow breath with me — and tell me, how are you feeling right now?",
    });
  }

  const live = mode === "listening" || mode === "speaking";

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col items-center px-5 py-6">
      <div className="relative flex flex-1 flex-col items-center justify-center">
        <div className="relative grid h-64 w-64 place-items-center">
          <motion.div
            className="absolute h-64 w-64 rounded-full blur-2xl"
            style={{ backgroundImage: "linear-gradient(135deg, rgb(99 76 196), rgb(38 192 176))" }}
            animate={{
              scale: mode === "speaking" ? [1, 1.18, 1] : live ? [1, 1.06, 1] : [1, 1.03, 1],
              opacity: live ? 0.4 : 0.22,
            }}
            transition={{ duration: mode === "speaking" ? 1.1 : 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <AnimatePresence>
            {mode === "speaking" &&
              [0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-primary/40"
                  initial={{ width: 150, height: 150, opacity: 0.5 }}
                  animate={{ width: 260, height: 260, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
                />
              ))}
          </AnimatePresence>
          <motion.div
            className="relative grid h-40 w-40 place-items-center rounded-full text-white shadow-glow"
            style={{ backgroundImage: "linear-gradient(135deg, rgb(99 76 196), rgb(38 192 176))" }}
            animate={{ scale: mode === "speaking" ? [1, 1.07, 1] : 1 }}
            transition={{ duration: 0.9, repeat: mode === "speaking" ? Infinity : 0, ease: "easeInOut" }}
          >
            {mode === "connecting" ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : (
              <span className="text-5xl">🤍</span>
            )}
          </motion.div>
        </div>

        <p className="mt-8 text-center font-display text-xl text-ink">
          {mode === "error" ? (error ?? STATUS.error) : STATUS[mode]}
        </p>
        {cp && mode === "idle" && (
          <p className="mt-1.5 text-center text-sm text-muted">
            A calm voice call, just for you, {cp.identity.nickname}. No marks, no judgement.
          </p>
        )}
        {error && <p className="mt-2 max-w-xs text-center text-sm text-alert">{error}</p>}
      </div>

      {lines.length > 0 && (
        <div
          ref={scrollRef}
          className="thin-scroll mb-4 max-h-40 w-full space-y-2 overflow-y-auto rounded-2xl border border-line/60 bg-surface/60 p-3"
        >
          {lines.slice(-8).map((l) => (
            <p
              key={l.id}
              className={cn(
                "text-sm leading-relaxed",
                l.role === "user" ? "text-muted" : "font-medium text-ink",
              )}
            >
              <span className="text-xs font-semibold text-faint">
                {l.role === "user" ? "You" : "Sukoon"} ·{" "}
              </span>
              {l.text}
            </p>
          ))}
        </div>
      )}

      {crisis && (
        <div className="mb-4 w-full">
          <HelplineCard compact />
        </div>
      )}

      <div className="w-full pb-2">
        {!live && mode !== "connecting" ? (
          <button onClick={callSukoon} className="btn-primary w-full py-4 text-base">
            <Phone className="h-5 w-5" /> Start the call
          </button>
        ) : (
          <button
            onClick={end}
            disabled={mode === "connecting"}
            className="btn w-full bg-alert py-4 text-base text-white disabled:opacity-60"
          >
            <PhoneOff className="h-5 w-5" /> End call
          </button>
        )}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-faint">
          <Mic className="h-3 w-3" /> Sukoon is a wellbeing companion, not a medical service. In crisis, call Tele-MANAS 14416.
        </p>
      </div>
    </div>
  );
}
