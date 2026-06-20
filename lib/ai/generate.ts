import { generateText, streamText, type LanguageModel } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { ChatMessage } from "@/lib/types";

// Bare Claude model aliases (no date suffixes). Used directly with the
// Anthropic provider, or prefixed with "anthropic/" for the AI Gateway.
export const MODELS = {
  chat: "claude-sonnet-4-6", // warm, fast companion turns (high volume)
  fast: "claude-haiku-4-5", // cheap classification / quick calls
  synthesis: "claude-opus-4-8", // nuanced Care-Profile reflection
} as const;

/**
 * The app works with EITHER credential, with no code change:
 *  - ANTHROPIC_API_KEY     → call Claude directly via @ai-sdk/anthropic
 *  - AI_GATEWAY_API_KEY    → route "anthropic/<model>" through the Vercel AI Gateway
 *  - neither               → AI is disabled; callers use the scripted fallback
 */
export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY);
}

function resolveModel(kind: keyof typeof MODELS): LanguageModel {
  const id = MODELS[kind];
  if (process.env.ANTHROPIC_API_KEY) return anthropic(id);
  return `anthropic/${id}`; // gateway resolves the provider from AI_GATEWAY_API_KEY
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCoreMessages(messages: ChatMessage[]): any[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Stream a companion reply as plain text. Returns null if AI is unavailable or
 * the model call fails to start — the caller then streams a safe fallback.
 * Note: no `temperature` — it 400s on Opus 4.8 and is removed on newer models;
 * tone is driven entirely by the system prompt.
 */
export async function streamCompanion(
  system: string,
  messages: ChatMessage[],
): Promise<Response | null> {
  if (!aiEnabled()) return null;
  try {
    const result = streamText({
      model: resolveModel("chat"),
      system,
      messages: toCoreMessages(messages),
      maxOutputTokens: 600,
    });
    return result.toTextStreamResponse();
  } catch {
    return null;
  }
}

/** One-shot text completion (openers, summaries). Returns null on failure. */
export async function complete(
  system: string,
  prompt: string,
  kind: keyof typeof MODELS = "chat",
): Promise<string | null> {
  if (!aiEnabled()) return null;
  try {
    const { text } = await generateText({
      model: resolveModel(kind),
      system,
      prompt,
      maxOutputTokens: 500,
    });
    return text.trim() || null;
  } catch {
    return null;
  }
}

/** Turn a string into a slow-ish text stream (used for safe fallbacks). */
export function textToStream(text: string): Response {
  const encoder = new TextEncoder();
  const words = text.split(/(\s+)/);
  const stream = new ReadableStream({
    async start(controller) {
      for (const w of words) {
        controller.enqueue(encoder.encode(w));
        await new Promise((r) => setTimeout(r, 18));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
