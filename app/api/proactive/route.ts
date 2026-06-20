import type { NextRequest } from "next/server";
import type { CareProfile, ProactiveType } from "@/lib/types";
import { buildProactiveSystemPrompt } from "@/lib/ai/personas";
import { complete } from "@/lib/ai/generate";
import { fallbackOpener } from "@/lib/ai/fallback";

export const runtime = "nodejs";

const PROMPT: Record<ProactiveType, string> = {
  welcome: "Write your very first message to this student.",
  daily_pulse: "Open a gentle daily check-in about how they're feeling today.",
  study_break: "They've been studying a while. Nudge them to pause and check in.",
  trend_dip:
    "Their mood has dipped over the last few days. Reach out with care about it.",
  missed_checkin:
    "They've been quiet for a few days. Reach out warmly, no guilt.",
  pre_exam: "Their exam is approaching. Reach out with grounding reassurance.",
};

export async function POST(req: NextRequest) {
  let body: { careProfile: CareProfile; type: ProactiveType };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const { careProfile, type } = body;

  let opener: string | null = null;
  if (careProfile) {
    opener = await complete(buildProactiveSystemPrompt(careProfile), PROMPT[type]);
  }
  if (!opener) opener = fallbackOpener(careProfile, type);

  return Response.json({ opener });
}
