import { describe, it, expect } from "vitest";
import { toSnapshot, fromSnapshot, SLIDER_DEFAULTS } from "@/lib/onboarding/config";

describe("toSnapshot", () => {
  it("inverts the 'connection' slider into loneliness (high connection = low loneliness)", () => {
    const snap = toSnapshot({ ...SLIDER_DEFAULTS, loneliness: 70 });
    expect(snap.loneliness).toBe(30);
  });

  it("passes other dimensions through unchanged", () => {
    const snap = toSnapshot({ ...SLIDER_DEFAULTS, mood: 88, stress: 12 });
    expect(snap.mood).toBe(88);
    expect(snap.stress).toBe(12);
  });

  it("round-trips through fromSnapshot", () => {
    const values = { ...SLIDER_DEFAULTS, loneliness: 65, mood: 40 };
    const back = fromSnapshot(toSnapshot(values));
    expect(back.loneliness).toBe(65);
    expect(back.mood).toBe(40);
  });
});
