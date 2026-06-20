import { describe, it, expect } from "vitest";
import {
  wellnessIndex,
  scoreScreening,
  deriveRiskTier,
} from "@/lib/care/scoring";
import type { SliderSnapshot } from "@/lib/types";

const snap = (over: Partial<SliderSnapshot> = {}): SliderSnapshot => ({
  stress: 50,
  sleep: 50,
  mood: 50,
  motivation: 50,
  anxiety: 50,
  confidence: 50,
  energy: 50,
  loneliness: 50,
  ...over,
});

describe("wellnessIndex", () => {
  it("returns 50 for a fully neutral snapshot", () => {
    expect(wellnessIndex(snap())).toBe(50);
  });

  it("is high when positives are high and stressors are low", () => {
    const good = snap({
      mood: 80,
      sleep: 80,
      motivation: 80,
      confidence: 80,
      energy: 80,
      stress: 20,
      anxiety: 20,
      loneliness: 20,
    });
    expect(wellnessIndex(good)).toBe(80);
  });

  it("inverts stress/anxiety/loneliness (higher = worse)", () => {
    const heavy = snap({ stress: 100, anxiety: 100, loneliness: 100 });
    const calm = snap({ stress: 0, anxiety: 0, loneliness: 0 });
    expect(wellnessIndex(heavy)).toBeLessThan(wellnessIndex(calm));
  });

  it("clamps into 0..100", () => {
    const v = wellnessIndex(snap({ mood: 0, sleep: 0, motivation: 0, confidence: 0, energy: 0, stress: 100, anxiety: 100, loneliness: 100 }));
    expect(v).toBe(0);
  });
});

describe("scoreScreening", () => {
  it("sums short forms and flags the self-harm item", () => {
    const s = scoreScreening({ phq: [3, 3, 2], gad: [3, 3], pss: [4, 4, 4, 4] });
    expect(s.phq).toBe(6);
    expect(s.gad).toBe(6);
    expect(s.pss).toBe(16);
    expect(s.phqFlag9).toBe(true);
    expect(s.depScreen).toBe(true);
    expect(s.anxScreen).toBe(true);
  });

  it("ignores unanswered (-1) items and does not flag self-harm", () => {
    const s = scoreScreening({ phq: [-1, -1, -1], gad: [-1, -1], pss: [-1, -1, -1, -1] });
    expect(s.phq).toBe(0);
    expect(s.gad).toBe(0);
    expect(s.phqFlag9).toBe(false);
    expect(s.depScreen).toBe(false);
  });
});

describe("deriveRiskTier", () => {
  it("returns crisis whenever the self-harm item is flagged", () => {
    const s = scoreScreening({ phq: [0, 0, 1], gad: [0, 0], pss: [0, 0, 0, 0] });
    expect(deriveRiskTier(s, 95)).toBe("crisis");
  });

  it("returns thriving when nothing is elevated", () => {
    const s = scoreScreening({ phq: [0, 0, 0], gad: [0, 0], pss: [0, 0, 0, 0] });
    expect(deriveRiskTier(s, 80)).toBe("thriving");
  });

  it("returns strained when both screens are positive", () => {
    const s = scoreScreening({ phq: [2, 2, 0], gad: [2, 2], pss: [2, 2, 2, 2] });
    expect(deriveRiskTier(s, 50)).toBe("strained");
  });

  it("returns managing for a single positive screen", () => {
    const s = scoreScreening({ phq: [2, 1, 0], gad: [0, 0], pss: [0, 0, 0, 0] });
    expect(deriveRiskTier(s, 70)).toBe("managing");
  });
});
