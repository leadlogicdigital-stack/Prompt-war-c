import type { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Proactive engine — production shape.
 *
 * Scheduled by Vercel Cron (see vercel.ts). In production this would:
 *   1. Read users whose preferred check-in time is "now" (daily_pulse / study_break)
 *   2. Read at-risk users whose wellness trend has dipped (trend_dip)
 *   3. Read users who've gone quiet past their cadence (missed_checkin)
 *   4. Generate a tailored opener per user (lib/ai/personas + generate)
 *   5. Insert a pending row in `proactive_events` (Supabase) that the app
 *      surfaces on the user's next visit (and later: web push).
 *
 * In local-preview mode there is no server-side user store, so proactivity is
 * driven client-side (see lib/store). This endpoint stays so the cron is wired
 * and verifiable, and becomes the real engine once Supabase keys are added.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const hasDb = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  return Response.json({
    ok: true,
    mode: hasDb ? "db" : "local",
    processed: 0,
    ranAt: new Date().toISOString(),
    note: hasDb
      ? "Connect proactive_events insertion here."
      : "Local mode: proactivity runs in-browser. Add Supabase keys to enable server-driven check-ins.",
  });
}
