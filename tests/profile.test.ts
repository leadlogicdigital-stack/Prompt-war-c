import { describe, it, expect } from "vitest";
import { assembleCareProfile, buildPersona } from "@/lib/care/profile";
import type { Identity, Preferences, SliderSnapshot } from "@/lib/types";

const identity: Identity = {
  nickname: "Arjun",
  age: 18,
  exam: "NEET",
  attempt: "dropper",
  monthsToExam: 7,
  studySetup: "kota",
  awayFromFamily: true,
  studyHours: 11,
};

const baseline: SliderSnapshot = {
  stress: 70,
  sleep: 40,
  mood: 45,
  motivation: 50,
  anxiety: 65,
  confidence: 40,
  energy: 45,
  loneliness: 60,
};

const preferences: Preferences = {
  proactivity: "high",
  checkinTimes: ["morning"],
  commStyle: "gentle",
  language: "hinglish",
  helpTypes: ["vent", "coping"],
};

describe("assembleCareProfile", () => {
  it("produces a complete, internally consistent Care Profile", () => {
    const cp = assembleCareProfile({
      identity,
      baseline,
      stressors: ["parents", "isolation"],
      screening: { phq: [1, 1, 0], gad: [2, 1], pss: [2, 2, 2, 2] },
      preferences,
    });

    expect(cp.id.startsWith("care")).toBe(true);
    expect(cp.wellnessIndex).toBeGreaterThanOrEqual(0);
    expect(cp.wellnessIndex).toBeLessThanOrEqual(100);
    expect(["thriving", "managing", "strained", "crisis"]).toContain(cp.riskTier);
    expect(cp.persona.name).toBe("Sukoon");
    expect(cp.summary.length).toBeGreaterThan(0);
  });

  it("escalates persona behaviour for a crisis-tier student", () => {
    const cp = assembleCareProfile({
      identity,
      baseline,
      stressors: ["failure"],
      screening: { phq: [3, 3, 2], gad: [3, 3], pss: [4, 4, 4, 4] }, // self-harm flagged
      preferences,
    });
    expect(cp.riskTier).toBe("crisis");
    expect(cp.persona.escalation).toBe("urgent");
    expect(cp.persona.pushiness).toBe("low");
  });
});

describe("buildPersona", () => {
  it("uses the chosen language and a coach tone with high pushiness when thriving", () => {
    const persona = buildPersona({ ...preferences, commStyle: "coach" }, "thriving", ["parents"]);
    expect(persona.language).toBe("hinglish");
    expect(persona.pushiness).toBe("high");
    expect(persona.escalation).toBe("standard");
  });
});
