import type {
  CareProfile,
  Identity,
  PersonaConfig,
  Preferences,
  RiskTier,
  ScreeningAnswers,
  SliderSnapshot,
} from "@/lib/types";
import { deriveRiskTier, scoreScreening, wellnessIndex } from "@/lib/care/scoring";
import { EXAMS, STRESSORS } from "@/lib/onboarding/config";
import { uid } from "@/lib/utils";

export function examLabel(exam: Identity["exam"]): string {
  return EXAMS.find((e) => e.value === exam)?.label ?? exam;
}

export function stressorLabels(ids: string[]): string[] {
  return ids
    .map((id) => STRESSORS.find((s) => s.id === id)?.label)
    .filter(Boolean) as string[];
}

export function buildPersona(
  prefs: Preferences,
  tier: RiskTier,
  stressors: string[],
): PersonaConfig {
  const toneMap: Record<Preferences["commStyle"], string> = {
    gentle: "warm, soft, deeply validating; never preachy",
    practical: "direct and practical; clear, kind, action-oriented",
    coach: "encouraging and motivating; energetic but never dismissive",
  };
  const pushiness =
    tier === "crisis" || tier === "strained"
      ? "low"
      : prefs.commStyle === "coach"
        ? "high"
        : "medium";
  const escalation =
    tier === "crisis" ? "urgent" : tier === "strained" ? "watchful" : "standard";

  return {
    name: "Sukoon",
    tone: toneMap[prefs.commStyle],
    language: prefs.language,
    pushiness,
    focus: prefs.helpTypes,
    stressorAwareness: stressorLabels(stressors),
    escalation,
  };
}

interface AssembleInput {
  identity: Identity;
  baseline: SliderSnapshot;
  stressors: string[];
  screening: ScreeningAnswers;
  preferences: Preferences;
  summary?: string;
}

/** Compute the full Care Profile except the AI summary (caller fills that). */
export function assembleCareProfile(input: AssembleInput): CareProfile {
  const scores = scoreScreening(input.screening);
  const index = wellnessIndex(input.baseline);
  const tier = deriveRiskTier(scores, index);
  const persona = buildPersona(input.preferences, tier, input.stressors);

  return {
    id: uid("care"),
    createdAt: new Date().toISOString(),
    version: 1,
    identity: input.identity,
    baseline: input.baseline,
    stressors: input.stressors,
    screeningScores: scores,
    preferences: input.preferences,
    wellnessIndex: index,
    riskTier: tier,
    summary: input.summary ?? localSummary(input.identity, input.baseline, input.stressors, tier),
    persona,
  };
}

/**
 * Warm, validating fallback summary used when no AI key is configured.
 * Mirrors the "Here's what I'm hearing" reflection the live model produces.
 */
export function localSummary(
  identity: Identity,
  baseline: SliderSnapshot,
  stressors: string[],
  tier: RiskTier,
): string {
  const name = identity.nickname || "there";
  const exam = examLabel(identity.exam);
  const top = stressorLabels(stressors).slice(0, 2);
  const lead =
    identity.attempt === "dropper"
      ? `Taking a drop year for ${exam} takes real courage, ${name}.`
      : identity.attempt === "repeat"
        ? `Going again at ${exam} after everything — that's grit, ${name}.`
        : `${exam} prep is a marathon, ${name}, and you've started honestly.`;

  const feeling =
    baseline.stress > 65 || baseline.anxiety > 65
      ? "I can hear how much pressure you're under right now."
      : baseline.mood < 40
        ? "It sounds like things have felt heavy lately."
        : "You seem to be holding things together, even if it's tiring.";

  const because = top.length
    ? ` A lot of it is tied to ${top.join(" and ").toLowerCase()} — that's so common here, and it's not weakness.`
    : "";

  const promise =
    tier === "crisis"
      ? " Right now, the most important thing is your safety — I'll always keep real help one tap away."
      : tier === "strained"
        ? " I'll check in a little more often, keep things gentle, and we'll take it one day at a time."
        : tier === "managing"
          ? " I'll be around through the ups and downs, and we'll build small habits that actually stick."
          : " I'll keep you steady and celebrate the small wins with you.";

  return `${lead} ${feeling}${because}${promise}`;
}
