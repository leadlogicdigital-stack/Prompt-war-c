"use client";

import { useEffect, useRef, useState } from "react";
import type { CareProfile } from "@/lib/types";
import { detectCrisis } from "@/lib/safety/helplines";
import { examLabel, stressorLabels } from "@/lib/care/profile";
import { RISK_META } from "@/lib/care/scoring";
import { uid } from "@/lib/utils";

export type VoiceMode = "idle" | "connecting" | "listening" | "speaking" | "error";
export interface VoiceLine {
  id: string;
  role: "user" | "ai";
  text: string;
}

/** Care-Profile context passed to the agent as dynamic variables. */
export function careVars(cp: CareProfile | null): Record<string, string> {
  if (!cp) return {};
  return {
    nickname: cp.identity.nickname || "there",
    exam: examLabel(cp.identity.exam),
    stressors: stressorLabels(cp.stressors).join(", ") || "exam pressure",
    risk_tier: RISK_META[cp.riskTier].label,
  };
}

/**
 * Shared ElevenLabs realtime voice session. Used by both the Voice screen and
 * the SOS overlay so the connection logic lives in exactly one place.
 */
export function useVoiceSession() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convoRef = useRef<any>(null);
  const [mode, setMode] = useState<VoiceMode>("idle");
  const [lines, setLines] = useState<VoiceLine[]>([]);
  const [crisis, setCrisis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      convoRef.current?.endSession?.();
    };
  }, []);

  async function start(dynamicVariables: Record<string, string>) {
    setError(null);
    setLines([]);
    setCrisis(false);
    setMode("connecting");
    try {
      const res = await fetch("/api/voice/token", { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(
          d.error === "voice_not_configured"
            ? "Voice isn't switched on for this server yet."
            : "I couldn't start the call just now. Try again in a moment?",
        );
        setMode("error");
        return;
      }
      const { token } = await res.json();
      const { Conversation } = await import("@elevenlabs/client");
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
          setError("Something interrupted the call.");
          setMode("error");
        },
      });
    } catch {
      setError("I need your microphone to talk. Please allow mic access and try again.");
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

  return { mode, lines, crisis, error, start, end };
}
