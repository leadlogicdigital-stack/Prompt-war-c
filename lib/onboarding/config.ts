import type {
  ExamType,
  AttemptStage,
  StudySetup,
  CommStyle,
  Language,
  Proactivity,
  SliderSnapshot,
} from "@/lib/types";

/** Neutral starting position for every slider (mid-point feels least leading). */
export const SLIDER_DEFAULTS: Record<string, number> = {
  mood: 55,
  stress: 50,
  anxiety: 50,
  sleep: 55,
  motivation: 55,
  confidence: 55,
  energy: 55,
  loneliness: 60, // shown as "connection"
};

/** Slider UI uses a "connection" frame; storage uses loneliness (high = lonelier). */
export function toSnapshot(v: Record<string, number>): SliderSnapshot {
  return {
    stress: v.stress ?? 50,
    sleep: v.sleep ?? 50,
    mood: v.mood ?? 50,
    motivation: v.motivation ?? 50,
    anxiety: v.anxiety ?? 50,
    confidence: v.confidence ?? 50,
    energy: v.energy ?? 50,
    loneliness: 100 - (v.loneliness ?? 50),
  };
}

export function fromSnapshot(s: SliderSnapshot): Record<string, number> {
  return {
    stress: s.stress,
    sleep: s.sleep,
    mood: s.mood,
    motivation: s.motivation,
    anxiety: s.anxiety,
    confidence: s.confidence,
    energy: s.energy,
    loneliness: 100 - s.loneliness,
  };
}

export const EXAMS: { value: ExamType; label: string; hint: string }[] = [
  { value: "JEE", label: "JEE", hint: "Engineering · IIT/NIT" },
  { value: "NEET", label: "NEET", hint: "Medical · MBBS/BDS" },
  { value: "UPSC", label: "UPSC", hint: "Civil Services" },
  { value: "CAT", label: "CAT", hint: "MBA · IIMs" },
  { value: "GATE", label: "GATE", hint: "M.Tech / PSU" },
  { value: "CLAT", label: "CLAT", hint: "Law" },
  { value: "BOARDS", label: "Board exams", hint: "Class 10 / 12" },
  { value: "OTHER", label: "Something else", hint: "Banking, SSC, state…" },
];

export const ATTEMPTS: { value: AttemptStage; label: string; hint: string }[] = [
  { value: "first", label: "First attempt", hint: "This is my first time" },
  { value: "repeat", label: "Repeating", hint: "Giving it another shot" },
  { value: "dropper", label: "Drop year", hint: "Took a year off to focus" },
];

export const STUDY_SETUPS: { value: StudySetup; label: string }[] = [
  { value: "coaching", label: "Coaching institute" },
  { value: "kota", label: "Kota / hub city" },
  { value: "hostel", label: "Hostel / PG" },
  { value: "self", label: "Self-study" },
  { value: "home", label: "Studying from home" },
];

/** key on SliderSnapshot, with framing. `invert` = a high value is the hard one. */
export interface SliderDef {
  key:
    | "stress"
    | "sleep"
    | "mood"
    | "motivation"
    | "anxiety"
    | "confidence"
    | "loneliness"
    | "energy";
  label: string;
  prompt: string;
  low: string;
  high: string;
  invert: boolean;
  hue: string; // rgb triplet for the slider fill
}

export const SLIDERS: SliderDef[] = [
  {
    key: "mood",
    label: "Mood",
    prompt: "How's your mood today?",
    low: "Really low",
    high: "Pretty good",
    invert: false,
    hue: "99 76 196",
  },
  {
    key: "stress",
    label: "Stress",
    prompt: "How much pressure are you feeling?",
    low: "Calm",
    high: "Crushing",
    invert: true,
    hue: "230 108 108",
  },
  {
    key: "anxiety",
    label: "Exam anxiety",
    prompt: "How anxious does the exam make you right now?",
    low: "At ease",
    high: "On edge",
    invert: true,
    hue: "235 150 86",
  },
  {
    key: "sleep",
    label: "Sleep",
    prompt: "How well have you been sleeping?",
    low: "Barely",
    high: "Restful",
    invert: false,
    hue: "122 150 235",
  },
  {
    key: "motivation",
    label: "Motivation",
    prompt: "How's your drive to study?",
    low: "Running dry",
    high: "Fired up",
    invert: false,
    hue: "38 192 176",
  },
  {
    key: "confidence",
    label: "Confidence",
    prompt: "How confident are you in your prep?",
    low: "Shaky",
    high: "Solid",
    invert: false,
    hue: "52 191 159",
  },
  {
    key: "energy",
    label: "Energy",
    prompt: "How are your energy levels?",
    low: "Drained",
    high: "Charged",
    invert: false,
    hue: "244 158 120",
  },
  {
    key: "loneliness",
    label: "Connection",
    prompt: "How connected do you feel to people?",
    low: "Very alone",
    high: "Supported",
    invert: false, // shown as connection (high = good); stored as loneliness via transform
    hue: "162 130 230",
  },
];

// ── Gentle, student-contextualised screening (short validated forms) ──
export const PHQ_SCALE = [
  "Not at all",
  "Several days",
  "More than half the days",
  "Nearly every day",
];

export const PSS_SCALE = [
  "Never",
  "Almost never",
  "Sometimes",
  "Fairly often",
  "Very often",
];

export interface ScreenItem {
  text: string;
  scale: string[];
  safety?: boolean;
}

// PHQ short form — index 2 is the safety item
export const PHQ_ITEMS: ScreenItem[] = [
  {
    text: "Over the last 2 weeks, how often have you felt down, low, or hopeless?",
    scale: PHQ_SCALE,
  },
  {
    text: "How often have you had little interest or pleasure in things you used to enjoy?",
    scale: PHQ_SCALE,
  },
  {
    text: "How often have you had thoughts that you'd be better off not here, or of hurting yourself?",
    scale: PHQ_SCALE,
    safety: true,
  },
];

export const GAD_ITEMS: ScreenItem[] = [
  {
    text: "Over the last 2 weeks, how often have you felt nervous, anxious, or on edge?",
    scale: PHQ_SCALE,
  },
  {
    text: "How often have you been unable to stop or control worrying?",
    scale: PHQ_SCALE,
  },
];

export const PSS_ITEMS: ScreenItem[] = [
  { text: "In the last month, how often have you felt unable to control the important things in your life?", scale: PSS_SCALE },
  { text: "How often have you felt confident about handling your problems?", scale: PSS_SCALE },
  { text: "How often have you felt that things were going your way?", scale: PSS_SCALE },
  { text: "How often have you felt difficulties were piling up so high you couldn't cope?", scale: PSS_SCALE },
];
// PSS items 1 & 2 (index 1,2) are positively worded → reverse scored
export const PSS_REVERSED = [1, 2];

// ── India-specific stressors ─────────────────────────────────────────
export const STRESSORS: { id: string; label: string; emoji: string }[] = [
  { id: "parents", label: "Parental expectations", emoji: "👪" },
  { id: "rank", label: "Rank & peer comparison", emoji: "📊" },
  { id: "money", label: "Family's financial sacrifice", emoji: "💰" },
  { id: "log-kya-kahenge", label: "“Log kya kahenge”", emoji: "🗣️" },
  { id: "failure", label: "Fear of failing", emoji: "😰" },
  { id: "isolation", label: "Loneliness / away from home", emoji: "🏚️" },
  { id: "social-media", label: "Social-media comparison", emoji: "📱" },
  { id: "sleep", label: "Sleep & screen time", emoji: "🌙" },
  { id: "self-doubt", label: "Self-doubt", emoji: "🪞" },
  { id: "relationships", label: "Relationships", emoji: "💬" },
  { id: "health", label: "Physical health", emoji: "🩺" },
  { id: "future", label: "What if all this is wasted", emoji: "🧭" },
];

// ── Preferences ──────────────────────────────────────────────────────
export const PROACTIVITY: { value: Proactivity; label: string; hint: string }[] = [
  { value: "high", label: "Check on me often", hint: "Reach out daily, nudge me" },
  { value: "gentle", label: "Gently, now and then", hint: "A light touch" },
  { value: "minimal", label: "Only when I open up", hint: "I'll come to you" },
];

export const CHECKIN_TIMES: { id: string; label: string; emoji: string }[] = [
  { id: "morning", label: "Morning", emoji: "🌅" },
  { id: "afternoon", label: "Afternoon break", emoji: "☀️" },
  { id: "evening", label: "Evening", emoji: "🌆" },
  { id: "night", label: "Late night", emoji: "🌙" },
];

export const COMM_STYLES: { value: CommStyle; label: string; hint: string }[] = [
  { value: "gentle", label: "Gentle & warm", hint: "Soft, validating, no pressure" },
  { value: "practical", label: "Direct & practical", hint: "Clear steps, straight talk" },
  { value: "coach", label: "Motivational", hint: "Pump me up, keep me going" },
];

export const LANGUAGES: { value: Language; label: string; hint: string }[] = [
  { value: "hinglish", label: "Hinglish", hint: "English + thoda Hindi" },
  { value: "en", label: "English", hint: "" },
  { value: "hi", label: "हिंदी", hint: "" },
];

export const HELP_TYPES: { id: string; label: string; emoji: string }[] = [
  { id: "vent", label: "Someone to vent to", emoji: "🫶" },
  { id: "coping", label: "Coping techniques", emoji: "🧘" },
  { id: "balance", label: "Study-life balance", emoji: "⚖️" },
  { id: "motivation", label: "Motivation", emoji: "🔥" },
  { id: "tracking", label: "Just track my wellbeing", emoji: "📈" },
];
