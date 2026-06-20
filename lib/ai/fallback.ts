import type { CareProfile, ChatMessage, ProactiveType } from "@/lib/types";
import { examLabel } from "@/lib/care/profile";

// Warm, varied, India-aware companion replies used when no AI key is set.
// Not as fluid as the live model, but never robotic and always safe.

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function fallbackReply(
  p: CareProfile | null,
  history: ChatMessage[],
): string {
  const last = [...history].reverse().find((m) => m.role === "user");
  const text = (last?.content ?? "").toLowerCase();
  const name = p?.identity.nickname || "yaar";
  const seed = hash(text + history.length);

  const validations = [
    `That sounds genuinely hard, ${name}. Thank you for telling me.`,
    `I hear you. What you're feeling makes complete sense.`,
    `Mmm. That's a lot to be carrying right now.`,
    `Okay. I'm right here with you — no rush.`,
  ];

  if (/stress|pressure|tension|overwhelm|too much|burnt|burned out|thak/.test(text)) {
    return `${pick(validations, seed)} The pressure around ${
      p ? examLabel(p.identity.exam) : "all this"
    } is real, and you're not weak for feeling it. Want to take one slow breath with me, or just talk it out?`;
  }
  if (/sleep|tired|neend|so nahi|awake/.test(text)) {
    return `Not sleeping makes everything heavier — your brain's running on empty. Be a little gentle with yourself tonight. What's keeping your mind awake?`;
  }
  if (/parent|family|mummy|papa|dad|mom|ghar/.test(text)) {
    return `Family expectations can sit so heavy, especially when you know they've sacrificed for you. Their hopes aren't your whole worth, though. What did they say that's stuck with you?`;
  }
  if (/fail|failure|rank|marks|score|mock|test|result/.test(text)) {
    return `One score doesn't define you, even when it feels like the whole world is watching. You are more than a rank, ${name}. What happened?`;
  }
  if (/lonely|alone|no friends|akela|miss/.test(text)) {
    return `Being away and alone with all this is one of the hardest parts — and you reached out, which takes something. I'm glad you're here. Tell me more?`;
  }
  if (/thank|better|good|theek|achha|nice|love you/.test(text)) {
    return `I'm really glad. I'm proud of you for showing up for yourself today. I'll be right here whenever you need me. 🤍`;
  }
  if (/hi|hello|hey|namaste|hii/.test(text.trim()) && text.length < 12) {
    return `Hey ${name} 🤍 I'm here. How's your heart doing today — honestly?`;
  }

  return `${pick(validations, seed)} I'm listening — tell me what's on your mind, and we'll take it together, one step at a time.`;
}

export function fallbackOpener(p: CareProfile, type: ProactiveType): string {
  const name = p.identity.nickname || "you";
  const exam = examLabel(p.identity.exam);

  const openers: Record<ProactiveType, string[]> = {
    welcome: [
      `Hey ${name} 🤍 I'm Sukoon. I'll check in on you through this ${exam} journey — not about marks, just about you. How are you feeling right now?`,
    ],
    daily_pulse: [
      `Morning, ${name}. Before the books take over — how did you wake up feeling today?`,
      `Hey ${name}, quick one from me: on a heavy-to-light scale, how's your head this morning?`,
    ],
    study_break: [
      `Take a breath, ${name}. You've been at it a while. How's it going in there?`,
      `Break time 🫧 Step back for a sec — how are you holding up?`,
    ],
    trend_dip: [
      `Hey ${name}, I noticed the last few days have felt a bit heavier than usual. I didn't want you to carry that alone — what's been going on?`,
      `${name}, things have looked a little low lately. No pressure to be okay — I'm just here. Want to talk?`,
    ],
    missed_checkin: [
      `Haven't heard from you in a bit, ${name} — that's completely okay. Just wanted you to know I'm still here whenever. How are you, really?`,
    ],
    pre_exam: [
      `The exam's getting close, ${name}. Whatever happens, your worth isn't on that answer sheet. How are you feeling as it approaches?`,
    ],
  };

  return pick(openers[type], hash(p.id + type));
}
