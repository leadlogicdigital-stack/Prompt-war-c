export const runtime = "nodejs";

/**
 * Mints a short-lived WebRTC conversation token for the Sukoon voice agent.
 * The ElevenLabs API key stays server-side and never reaches the browser.
 */
export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!key || !agentId) {
    return Response.json({ error: "voice_not_configured" }, { status: 503 });
  }

  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      { headers: { "xi-api-key": key }, cache: "no-store" },
    );
    if (!r.ok) {
      return Response.json({ error: "token_failed", status: r.status }, { status: 502 });
    }
    const data = await r.json();
    const token = data.token ?? data.conversation_token;
    if (!token) return Response.json({ error: "no_token" }, { status: 502 });
    return Response.json({ token });
  } catch {
    return Response.json({ error: "token_error" }, { status: 502 });
  }
}
