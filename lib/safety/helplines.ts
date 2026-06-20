// ── India mental-health helplines (verified national & 24x7 first) ───

export interface Helpline {
  name: string;
  number: string;
  tel: string; // dial-able form
  hours: string;
  note: string;
  languages?: string;
}

export const HELPLINES: Helpline[] = [
  {
    name: "Tele-MANAS",
    number: "14416",
    tel: "14416",
    hours: "24×7",
    note: "Government of India national mental-health helpline.",
    languages: "20+ Indian languages",
  },
  {
    name: "KIRAN",
    number: "1800-599-0019",
    tel: "18005990019",
    hours: "24×7",
    note: "National toll-free mental-health rehabilitation helpline.",
    languages: "13 languages",
  },
  {
    name: "Vandrevala Foundation",
    number: "+91 9999 666 555",
    tel: "+919999666555",
    hours: "24×7",
    note: "Free counselling and crisis support.",
  },
  {
    name: "iCall (TISS)",
    number: "+91 9152 987 821",
    tel: "+919152987821",
    hours: "Mon–Sat, 8am–10pm",
    note: "Psychosocial counselling by trained professionals.",
  },
  {
    name: "AASRA",
    number: "+91 9820 466 726",
    tel: "+919820466726",
    hours: "24×7",
    note: "Confidential support for those in distress.",
  },
];

// Fast client-side pre-filter. The server LLM classifier (when configured)
// does the nuanced read; this exists so safety never depends on a key.
const CRISIS_PATTERNS: RegExp[] = [
  /\b(kill|hurt|harm)\s+(myself|me)\b/i,
  /\b(end|ending)\s+(it all|my life|everything)\b/i,
  /\b(want|going|i'?m going)\s+to\s+die\b/i,
  /\bsuicid/i,
  /\bself[-\s]?harm/i,
  /\b(no|nothing)\s+(reason|point)\s+to\s+(live|go on)\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\b(can'?t|cannot)\s+(go on|do this anymore|take it anymore)\b/i,
  /\b(cut|cutting)\s+myself\b/i,
  /\boverdose\b/i,
  /\bgive up on (life|living)\b/i,
  // Hindi / Hinglish
  /\bmar\s*(jau|jaun|jaunga|jana)\b/i,
  /\b(jeena|jina)\s+nahi\b/i,
  /\b(khatam|khatm)\s+kar\b/i,
  /\bzinda\s+nahi\b/i,
  /\bapni jaan\b/i,
];

export function detectCrisis(text: string): boolean {
  if (!text) return false;
  return CRISIS_PATTERNS.some((re) => re.test(text));
}
