import type {
  ScreeningAnswers,
  ScreeningScores,
  SliderSnapshot,
  RiskTier,
} from "@/lib/types";
import { PSS_REVERSED } from "@/lib/onboarding/config";
import { clamp } from "@/lib/utils";

/**
 * Wellness Index (0–100): a single, gentle, interpretable number.
 * Positive feelings count up; stress / anxiety / loneliness are inverted.
 */
export function wellnessIndex(s: SliderSnapshot): number {
  const positives = [s.mood, s.sleep, s.motivation, s.confidence, s.energy];
  const inverted = [100 - s.stress, 100 - s.anxiety, 100 - s.loneliness];
  const all = [...positives, ...inverted];
  const avg = all.reduce((a, b) => a + b, 0) / all.length;
  return Math.round(clamp(avg));
}

/** Sum a short validated instrument, ignoring unanswered (-1) items. */
function sum(items: number[]): number {
  return items.filter((n) => n >= 0).reduce((a, b) => a + b, 0);
}

export function scoreScreening(a: ScreeningAnswers): ScreeningScores {
  // phq = item0 (low mood) + item1 (anhedonia); item2 is the self-harm safety item
  const phq2 = sum(a.phq.slice(0, 2));
  const gad2 = sum(a.gad.slice(0, 2));
  // PSS-4: the positively-worded items (PSS_REVERSED) are reverse-scored (4 - v).
  const pss = a.pss.reduce(
    (acc, v, i) => (v < 0 ? acc : acc + (PSS_REVERSED.includes(i) ? 4 - v : v)),
    0,
  );
  const phqFlag9 = (a.phq[2] ?? 0) > 0;
  return {
    phq: phq2,
    gad: gad2,
    pss,
    phqFlag9,
    depScreen: phq2 >= 3,
    anxScreen: gad2 >= 3,
  };
}

/**
 * Map scores + self-report into a calm severity tier.
 * Order matters — crisis wins, then strained, managing, thriving.
 */
export function deriveRiskTier(
  scores: ScreeningScores,
  index: number,
): RiskTier {
  if (scores.phqFlag9) return "crisis";

  const heavyClinical =
    (scores.depScreen && scores.anxScreen) ||
    scores.pss >= 13 ||
    index < 35;
  if (heavyClinical) return "strained";

  const someClinical =
    scores.depScreen || scores.anxScreen || scores.pss >= 9 || index < 58;
  if (someClinical) return "managing";

  return "thriving";
}

export const RISK_META: Record<
  RiskTier,
  { label: string; blurb: string; token: string; emoji: string }
> = {
  thriving: {
    label: "Thriving",
    blurb: "You're holding up well. Sukoon will keep you steady.",
    token: "good",
    emoji: "🌿",
  },
  managing: {
    label: "Managing",
    blurb: "You're carrying a real load, and coping. Let's lighten it together.",
    token: "accent",
    emoji: "🌤️",
  },
  strained: {
    label: "Under strain",
    blurb: "This is heavy right now. Sukoon will check in more often and gently.",
    token: "caution",
    emoji: "🫧",
  },
  crisis: {
    label: "Needs care now",
    blurb: "You matter. Let's get you real support, today.",
    token: "alert",
    emoji: "🤍",
  },
};
