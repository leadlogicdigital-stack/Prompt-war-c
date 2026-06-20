import type { NextRequest } from "next/server";
import type { CareProfile, ChatMessage, MoodCheckin } from "@/lib/types";
import { buildSystemPrompt } from "@/lib/ai/personas";
import { streamCompanion, textToStream } from "@/lib/ai/generate";
import { fallbackReply } from "@/lib/ai/fallback";
import { detectCrisis } from "@/lib/safety/helplines";

export const runtime = "nodejs";
export const maxDuration = 60;

const CRISIS_REPLY = (name: string) =>
  `${name}, I'm really glad you told me — and I want you to hear this clearly: you matter, and you are not alone in this. What you're feeling is pain, not a verdict on your worth.\n\nPlease reach out to someone right now who can stay with you through this — Tele-MANAS at 14416 (24×7, free, in your language), or a person you trust. I'm staying right here with you. Can you do that for me?`;

export async function POST(req: NextRequest) {
  let body: {
    careProfile: CareProfile | null;
    messages: ChatMessage[];
    recent?: MoodCheckin[];
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { careProfile, messages = [], recent = [] } = body;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const risk = detectCrisis(lastUser?.content ?? "");
  const name = careProfile?.identity.nickname || "I'm here";

  // Crisis short-circuit: never gamble on the model for a safety moment.
  if (risk) {
    const res = textToStream(CRISIS_REPLY(name));
    res.headers.set("x-sukoon-risk", "1");
    return res;
  }

  if (careProfile) {
    const system = buildSystemPrompt(careProfile, recent);
    const ai = await streamCompanion(system, messages);
    if (ai) return ai;
  }

  // No key / model error → warm, safe scripted companion.
  return textToStream(fallbackReply(careProfile, messages));
}
