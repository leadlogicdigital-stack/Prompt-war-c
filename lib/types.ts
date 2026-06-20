// ── Domain types for Sukoon ─────────────────────────────────────────

export type ExamType =
  | "JEE"
  | "NEET"
  | "UPSC"
  | "CAT"
  | "GATE"
  | "CLAT"
  | "BOARDS"
  | "OTHER";

export type AttemptStage = "first" | "repeat" | "dropper";
export type StudySetup = "coaching" | "kota" | "self" | "hostel" | "home";
export type CommStyle = "gentle" | "practical" | "coach";
export type Language = "en" | "hinglish" | "hi";
export type Proactivity = "high" | "gentle" | "minimal";

/** Calm, non-clinical labels for internal severity tiers. */
export type RiskTier = "thriving" | "managing" | "strained" | "crisis";

export interface Identity {
  nickname: string;
  age: number | null;
  exam: ExamType;
  attempt: AttemptStage;
  monthsToExam: number | null;
  studySetup: StudySetup;
  awayFromFamily: boolean;
  studyHours: number | null;
}

/** Every dimension is 0–100. Higher = more of that feeling. */
export interface SliderSnapshot {
  stress: number;
  sleep: number; // higher = better sleep
  mood: number; // higher = better mood
  motivation: number;
  anxiety: number;
  confidence: number;
  loneliness: number;
  energy: number;
}

export interface ScreeningAnswers {
  phq: number[]; // PHQ items, each 0–3
  gad: number[]; // GAD items, each 0–3
  pss: number[]; // PSS-4 items, each 0–4
}

export interface ScreeningScores {
  phq: number; // PHQ short-form sum (depressed mood + anhedonia), 0–6
  gad: number; // GAD short-form sum, 0–6
  pss: number; // PSS-4 perceived stress, 0–16
  phqFlag9: boolean; // self-harm safety item flagged
  depScreen: boolean; // PHQ-2 >= 3 → positive depression screen
  anxScreen: boolean; // GAD-2 >= 3 → positive anxiety screen
}

export interface Preferences {
  proactivity: Proactivity;
  checkinTimes: string[]; // 'morning' | 'afternoon' | 'evening' | 'night'
  commStyle: CommStyle;
  language: Language;
  helpTypes: string[]; // 'vent' | 'coping' | 'balance' | 'motivation' | 'tracking'
}

export interface PersonaConfig {
  name: string;
  tone: string;
  language: Language;
  pushiness: "low" | "medium" | "high";
  focus: string[];
  stressorAwareness: string[];
  escalation: "standard" | "watchful" | "urgent";
}

export interface CareProfile {
  id: string;
  createdAt: string;
  version: number;
  identity: Identity;
  baseline: SliderSnapshot;
  stressors: string[];
  screeningScores: ScreeningScores;
  preferences: Preferences;
  wellnessIndex: number; // 0–100
  riskTier: RiskTier;
  summary: string;
  persona: PersonaConfig;
}

export interface MoodCheckin extends SliderSnapshot {
  id: string;
  ts: string;
  note?: string;
  source: "manual" | "proactive" | "onboarding";
  wellnessIndex: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: string;
  risk?: boolean;
  helplines?: boolean; // render helpline card with this message
}

export interface Conversation {
  id: string;
  initiatedBy: "user" | "proactive";
  startedAt: string;
  context?: string;
  messages: ChatMessage[];
}

export type ProactiveType =
  | "daily_pulse"
  | "study_break"
  | "trend_dip"
  | "missed_checkin"
  | "pre_exam"
  | "welcome";

export interface ProactiveEvent {
  id: string;
  createdAt: string;
  type: ProactiveType;
  status: "pending" | "delivered" | "seen";
  opener: string;
  reason: string;
}

export interface JournalEntry {
  id: string;
  ts: string;
  content: string;
  moodTag?: string;
}

export interface CopingLog {
  id: string;
  tool: string;
  ts: string;
}

/** The full persisted state of a Sukoon user (local mode or mirrored to DB). */
export interface SukoonState {
  careProfile: CareProfile | null;
  checkins: MoodCheckin[];
  conversation: Conversation;
  proactive: ProactiveEvent[];
  journal: JournalEntry[];
  coping: CopingLog[];
  lastActiveDay: string | null;
}
