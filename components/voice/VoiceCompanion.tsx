"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Loader2, Mic } from "lucide-react";
import { useSukoon } from "@/lib/store";
import { detectCrisis } from "@/lib/safety/helplines";
import { HelplineCard } from "@/components/safety/HelplineCard";
import { examLabel, stressorLabels } from "@/lib/care/profile";
import { RISK_META } from "@/lib/care/scoring";
import { cn, uid } from "@/lib/utils";

type Mode = "idle" | "connecting" | "listening" | "speaking" | "error";
interface Line {
  id: string;
  role: "user" | "ai";
  text: string;
}

export function VoiceCompanion() {
  const { state } = useSukoon();
  const cp = state.careProfile;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convoRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>("idle");
  const [lines, setLines] = useState<Line[]>([]);
  const [crisis, setCrisis] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      convoRef.current?.endSession?.();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines.length]);

  async function start() {
    setErr(null);
    setLines([]);
    setCrisis(false);
    setMode("connecting");
    try {
      const res = await fetch("/api/voice/token", { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(
          d.error === "voice_not_configured"
            ? "Voice isn't switched on for this server yet."
            : "I couldn't start the call just now. Try again in a moment?",
        );
        setMode("error");
        return;
      }
      const { token } = await res.json();
      const { Conversation } = await import("@elevenlabs/client");

      const dynamicVariables: Record<string, string> = cp
        ? {
            nickname: cp.identity.nickname || "there",
            exam: examLabel(cp.identity.exam),
            stressors: stressorLabels(cp.stressors).join(", ") || "exam pressure",
            risk_tier: RISK_META[cp.riskTier].label,
          }
        : {};

      convoRef.current = await Conversation.startSession({
        conversationToken: token,
        connectionType: "webrtc",
        dynamicVariables,
        onConnect: () => setMode("listening"),
        onDisconnect: () => setMode("idle"),
        onModeChange: ({ mode: m }: { mode: string }) =>
          setMode(m === "speaking" ? "speaking" : "listening"),
        onMessage: ({ message, source }: { message: string; source: string }) => {
          if (!message) return;
          const role = source === "user" ? "user" : "ai";
          setLines((p) => [...p, { id: uid("vl"), role, text: message }]);
          if (role === "user" && detectCrisis(message)) setCrisis(true);
        },
        onError: () => {
          setErr("Something interrupted the call.");
          setMode("error");
        },
      });
    } catch {
      setErr("I need your microphone to talk. Please allow mic access and try again.");
      setMode("error");
    }
  }

  async function end() {
    try {
      await convoRef.current?.endSession?.();
    } catch {
      /* ignore */
    }
    convoRef.current = null;
    setMode("idle");
  }

  const live = mode === "listening" || mode === "speaking";
  const statusText: Record<Mode, string> = {
    idle: "Tap to talk with Sukoon",
    connecting: "Connecting you…",
    listening: "Listening — go ahead, I'm here",
    speaking: "Sukoon is speaking…",
    error: err ?? "Something went wrong",
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col items-center px-5 py-6">
      {/* orb */}
      <div className="relative flex flex-1 flex-col items-center justify-center">
        <div className="relative grid h-64 w-64 place-items-center">
          {/* breathing aura */}
          <motion.div
            className="absolute h-64 w-64 rounded-full blur-2xl"
            style={{ backgroundImage: "linear-gradient(135deg, rgb(99 76 196), rgb(38 192 176))" }}
            animate={{
              scale: mode === "speaking" ? [1, 1.18, 1] : live ? [1, 1.06, 1] : [1, 1.03, 1],
              opacity: live ? 0.4 : 0.22,
            }}
            transition={{ duration: mode === "speaking" ? 1.1 : 5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* speaking rings */}
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
          {/* core */}
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

        <p className="mt-8 text-center font-display text-xl text-ink">{statusText[mode]}</p>
        {cp && mode === "idle" && (
          <p className="mt-1.5 text-center text-sm text-muted">
            A calm voice call, just for you, {cp.identity.nickname}. No marks, no judgement.
          </p>
        )}
        {err && <p className="mt-2 max-w-xs text-center text-sm text-alert">{err}</p>}
      </div>

      {/* transcript */}
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

      {/* controls */}
      <div className="w-full pb-2">
        {!live && mode !== "connecting" ? (
          <button onClick={start} className="btn-primary w-full py-4 text-base">
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
