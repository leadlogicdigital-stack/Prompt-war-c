import type { NextRequest } from "next/server";
import type {
  Identity,
  Preferences,
  ScreeningAnswers,
  SliderSnapshot,
} from "@/lib/types";
import { assembleCareProfile, examLabel, stressorLabels } from "@/lib/care/profile";
import { RISK_META } from "@/lib/care/scoring";
import { complete } from "@/lib/ai/generate";

export const runtime = "nodejs";

const SYSTEM = `You are Sukoon, a warm mental-wellness companion for Indian students preparing for high-stakes exams. You are writing the "Here's what I'm hearing" reflection a student sees right after onboarding.

Rules:
- 3–4 sentences, second person, warm and validating. No bullet points.
- Reflect back what you heard (their exam reality, their biggest stressors, how they feel) so they feel deeply seen.
- Name one specific India-rooted pressure they mentioned.
- End with a gentle promise of how you'll support them — matched to how heavy things are.
- Never diagnose or use clinical labels. Never use toxic positivity. Don't give study advice.`;

export async function POST(req: NextRequest) {
  let body: {
    identity: Identity;
    baseline: SliderSnapshot;
    stressors: string[];
    screening: ScreeningAnswers;
    preferences: Preferences;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  // Compute scores/tier/persona locally first (deterministic, never fails).
  const draft = assembleCareProfile(body);

  const facts = `Student facts:
- Name: ${draft.identity.nickname || "(not given)"}
- Exam: ${examLabel(draft.identity.exam)}, attempt: ${draft.identity.attempt}${draft.identity.monthsToExam != null ? `, ${draft.identity.monthsToExam} months left` : ""}
- Setup: ${draft.identity.studySetup}${draft.identity.awayFromFamily ? ", away from family" : ""}
- Biggest pressures: ${stressorLabels(draft.stressors).join(", ") || "exam pressure"}
- How they feel now: mood ${draft.baseline.mood}/100, stress ${draft.baseline.stress}/100, anxiety ${draft.baseline.anxiety}/100, sleep ${draft.baseline.sleep}/100
- Overall standing: ${RISK_META[draft.riskTier].label} (wellness ${draft.wellnessIndex}/100)
- They want from you: ${draft.preferences.helpTypes.join(", ") || "support"}
- Preferred language: ${draft.preferences.language}

Write the reflection now.`;

  const aiSummary = await complete(SYSTEM, facts, "synthesis");
  const summary = aiSummary ?? draft.summary;

  return Response.json({ careProfile: { ...draft, summary } });
}
