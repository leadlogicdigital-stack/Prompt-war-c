import { describe, it, expect } from "vitest";
import { detectCrisis, HELPLINES } from "@/lib/safety/helplines";

describe("detectCrisis", () => {
  it("flags explicit English self-harm statements", () => {
    expect(detectCrisis("honestly i want to end my life")).toBe(true);
    expect(detectCrisis("I want to kill myself")).toBe(true);
    expect(detectCrisis("there's no reason to live anymore")).toBe(true);
    expect(detectCrisis("I can't go on anymore")).toBe(true);
  });

  it("flags Hindi / Hinglish distress phrasing", () => {
    expect(detectCrisis("bas ab mar jaun")).toBe(true);
    expect(detectCrisis("ab jeena nahi hai")).toBe(true);
  });

  it("does NOT flag ordinary exam stress", () => {
    expect(detectCrisis("I'm so stressed about NEET")).toBe(false);
    expect(detectCrisis("my mock test went badly today")).toBe(false);
    expect(detectCrisis("I feel a bit low but okay")).toBe(false);
  });

  it("handles empty / whitespace input safely", () => {
    expect(detectCrisis("")).toBe(false);
    expect(detectCrisis("   ")).toBe(false);
  });
});

describe("HELPLINES", () => {
  it("includes the national Tele-MANAS number", () => {
    const tm = HELPLINES.find((h) => h.name === "Tele-MANAS");
    expect(tm).toBeDefined();
    expect(tm?.number).toContain("14416");
  });

  it("every helpline has a dialable tel and hours", () => {
    for (const h of HELPLINES) {
      expect(h.tel.length).toBeGreaterThan(0);
      expect(h.hours.length).toBeGreaterThan(0);
    }
  });
});
