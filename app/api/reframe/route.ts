import type { NextRequest } from "next/server";
import type { CareProfile } from "@/lib/types";
import { complete } from "@/lib/ai/generate";

export const runtime = "nodejs";

const SYSTEM = `You are Sukoon, a warm companion for Indian students preparing for high-stakes competitive exams. The student shares a harsh, self-critical thought. Respond with ONE or TWO short sentences that gently reframe it — kinder and truer, never toxic positivity. First honour that it feels real and heavy, then loosen the all-or-nothing absolutism and point to the next small step. Be India- and student-aware. Output ONLY the reframed thought — no preamble, no quotes.`;

const FALLBACK =
  "That thought feels true right now, but it isn't the whole story. This is one hard moment, not a verdict on you — and you can take the next small step, one question at a time.";

export async function POST(req: NextRequest) {
  let body: { thought?: string; careProfile?: CareProfile | null };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  const thought = (body?.thought ?? "").toString().slice(0, 500).trim();
  if (!thought) return Response.json({ reframe: "" });

  const name = body?.careProfile?.identity?.nickname;
  const prompt = `${name ? `The student's name is ${name}. ` : ""}Their thought: "${thought}"`;

  const ai = await complete(SYSTEM, prompt);
  return Response.json({ reframe: ai ?? FALLBACK });
}
