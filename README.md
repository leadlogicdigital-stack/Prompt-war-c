# Sukoon — सुकून

**A proactive, India-specific mental wellness companion for students preparing for high-stakes competitive exams** (JEE, NEET, UPSC, CAT, GATE, CLAT, boards).

Not another generic mood tracker. Sukoon is:

- **Calibrated, not generic.** A multi-stage onboarding *screening* (honest sliders → a gentle, validated wellbeing check → India-specific stressor mapping → preferences) builds a per-student **Care Profile** *before* the app prescribes anything.
- **Proactive, not reactive.** Sukoon initiates conversations — a warm first hello, daily check-ins, and gentle outreach when your mood trend dips or you go quiet.
- **Personalised end-to-end.** The Care Profile customises the companion's tone, language (English / **Hinglish** / Hindi), how hard it pushes, how often it reaches out, and how fast it routes you to real help.
- **Safe by design.** Crisis language is detected, India helplines (Tele-MANAS 14416, KIRAN, Vandrevala…) are one tap away, and Sukoon never pretends to be a doctor.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

It works **out of the box with zero config** — "local mode": your data lives in
your browser, and the companion uses warm, India-aware scripted responses.

### Turn on the live brain (optional)

Copy `.env.example` → `.env.local` and add keys.

**For live Claude, pick *one* (you don't need both):**

| Key | What it does |
| --- | --- |
| `ANTHROPIC_API_KEY` | Calls Claude **directly** via `@ai-sdk/anthropic`. Use if you already have an Anthropic key. |
| `AI_GATEWAY_API_KEY` | Routes `anthropic/<model>` through the **Vercel AI Gateway** — no Anthropic key needed. |

If both are set, the Anthropic key wins. Models used: Sonnet 4.6 (chat), Opus 4.8 (Care-Profile synthesis), Haiku 4.5 (reserved for fast calls).

**Optional — cloud persistence & cron:**

| Key | What it unlocks |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` | Cloud persistence (Supabase free tier). Run `supabase/migrations/0001_init.sql` first — it includes Row-Level Security. |
| `CRON_SECRET` | Protects the proactive cron endpoint in production. |

No keys → everything still runs; features degrade gracefully, safety never does.

## How it fits together

```
Onboarding screening  →  Care Profile  →  drives everything
   (sliders + PHQ/GAD/PSS      │            ├─ companion system prompt (tone, language, push)
    + stressors + prefs)       │            ├─ proactive cadence & triggers
                               │            ├─ dashboard content
                               ▼            └─ crisis escalation thresholds
                         wellness index
                         + risk tier
```

- **Frontend:** Next.js (App Router) · Tailwind · Framer Motion · Recharts
- **AI:** Vercel AI SDK through the AI Gateway (Claude), with a safe scripted fallback
- **Data:** Supabase (Postgres + Auth + RLS) in production; localStorage in local mode
- **Proactivity:** Vercel Cron (`vercel.json`) + a client-side preview engine

### Key paths

| Area | Path |
| --- | --- |
| Onboarding wizard | `components/onboarding/OnboardingWizard.tsx` |
| Dashboard | `components/dashboard/Dashboard.tsx` |
| Companion chat | `components/chat/ChatView.tsx` |
| Care logic (scoring, persona) | `lib/care/` |
| AI prompts + fallback | `lib/ai/` |
| Safety (helplines + detection) | `lib/safety/helplines.ts` |
| API routes | `app/api/{chat,proactive,care-profile,cron/proactive}` |
| DB schema + RLS | `supabase/migrations/0001_init.sql` |

## Deploy

Push to Vercel, add the env vars above, and the cron in `vercel.json` registers
automatically.

---

> Sukoon is a wellbeing companion, not a medical service or a substitute for
> professional care. If you or someone you know is in crisis, call **Tele-MANAS
> 14416** (24×7, free) or your local emergency number.
