"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Wind,
  Eye,
  RefreshCw,
  Moon,
  Sparkles,
  TrendingUp,
  Flame,
  CalendarClock,
  Check,
} from "lucide-react";
import { Mark } from "@/components/brand/Logo";
import { Slider } from "@/components/ui/Slider";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { BreathingTool } from "@/components/dashboard/BreathingTool";
import { useSukoon } from "@/lib/store";
import { wellnessIndex, RISK_META } from "@/lib/care/scoring";
import { examLabel } from "@/lib/care/profile";
import { partOfDay, timeAgo, cn } from "@/lib/utils";
import type { MoodCheckin, SliderSnapshot } from "@/lib/types";

const QUICK = [
  { key: "mood", label: "Mood", low: "Low", high: "Good", hue: "99 76 196" },
  { key: "stress", label: "Stress", low: "Calm", high: "Crushing", hue: "230 108 108" },
  { key: "sleep", label: "Sleep", low: "Barely", high: "Restful", hue: "122 150 235" },
  { key: "energy", label: "Energy", low: "Drained", high: "Charged", hue: "244 158 120" },
] as const;

export function Dashboard() {
  const { state, addCheckin, pendingProactive, logCoping } = useSukoon();
  const cp = state.careProfile!;
  const checkins = state.checkins;

  const latest = checkins[0];
  const baseSnap: SliderSnapshot = latest ?? cp.baseline;

  const [quick, setQuick] = useState<Record<string, number>>({
    mood: baseSnap.mood,
    stress: baseSnap.stress,
    sleep: baseSnap.sleep,
    energy: baseSnap.energy,
  });
  const [saved, setSaved] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [tool, setTool] = useState<string | null>(null);

  const greeting = `Good ${partOfDay()}`;
  const pending = pendingProactive();

  const currentWellness = latest?.wellnessIndex ?? cp.wellnessIndex;
  const delta = currentWellness - cp.wellnessIndex;

  const streak = useMemo(() => computeStreak(checkins), [checkins]);
  const meta = RISK_META[cp.riskTier];

  function saveCheckin() {
    const snap: SliderSnapshot = { ...baseSnap, ...quick };
    addCheckin(snap, undefined, "manual");
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  }

  const previewIndex = wellnessIndex({ ...baseSnap, ...quick });

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-7">
      {/* greeting */}
      <div className="mb-6">
        <p className="label">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
          {greeting}, {cp.identity.nickname} <span className="align-middle">{meta.emoji}</span>
        </h1>
        <p className="mt-1 text-muted">
          {latest
            ? "Here's your calm corner for today."
            : "Let's start with a quick check-in below."}
        </p>
      </div>

      {/* proactive card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass mb-6 overflow-hidden"
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="shrink-0">
            <div className="relative">
              <div className="absolute inset-0 animate-breathe rounded-2xl bg-primary/30 blur-xl" />
              <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent">
                <Mark className="h-9 w-9 [&>rect]:fill-transparent" />
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="pill bg-primary-soft text-primary">
                <Sparkles className="h-3 w-3" /> Sukoon reached out
              </span>
              {pending && <span className="text-xs text-faint">{timeAgo(pending.createdAt)}</span>}
            </div>
            <p className="text-pretty text-[15px] leading-relaxed text-ink">
              {pending?.opener ??
                `I'm here whenever you need me, ${cp.identity.nickname}. Want to tell me how today's going?`}
            </p>
          </div>
          <Link href="/chat" className="btn-primary shrink-0">
            Reply <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {/* stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          icon={<TrendingUp className="h-4 w-4" />}
          label="Wellness today"
          value={`${currentWellness}`}
          sub={delta === 0 ? "your baseline" : `${delta > 0 ? "+" : ""}${delta} vs baseline`}
          tone={delta >= 0 ? "good" : "caution"}
        />
        <Stat
          icon={<Flame className="h-4 w-4" />}
          label="Check-in streak"
          value={`${streak}`}
          sub={streak === 1 ? "day — nice start" : "days in a row"}
          tone="accent"
        />
        {cp.identity.monthsToExam != null ? (
          <Stat
            icon={<CalendarClock className="h-4 w-4" />}
            label={`${examLabel(cp.identity.exam)} in`}
            value={`~${cp.identity.monthsToExam}`}
            sub="months · you've got time"
            tone="primary"
          />
        ) : (
          <Stat
            icon={<Sparkles className="h-4 w-4" />}
            label="Standing"
            value={meta.label}
            sub="we'll keep it steady"
            tone="primary"
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* check-in */}
        <div className="card p-5 lg:col-span-3">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">How are you right now?</h2>
            <span className="tabular-nums text-sm font-semibold text-primary">{previewIndex}/100</span>
          </div>
          <p className="mb-3 text-sm text-muted">A 20-second pulse. Honesty over optimism.</p>
          <div className="divide-y divide-line/60">
            {QUICK.map((q) => (
              <Slider
                key={q.key}
                compact
                label={q.label}
                low={q.low}
                high={q.high}
                hue={q.hue}
                value={quick[q.key]}
                onChange={(v) => setQuick((p) => ({ ...p, [q.key]: v }))}
              />
            ))}
          </div>
          <button onClick={saveCheckin} className={cn("btn-primary mt-4 w-full", saved && "!bg-good")}>
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Saved — thank you for showing up
              </>
            ) : (
              "Save today's check-in"
            )}
          </button>
        </div>

        {/* trend */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-1 font-display text-xl font-semibold text-ink">Your trend</h2>
          <p className="mb-4 text-sm text-muted">Wellness & stress over time.</p>
          <TrendChart checkins={checkins} />
        </div>
      </div>

      {/* coping toolkit */}
      <div className="mt-6">
        <h2 className="mb-1 font-display text-xl font-semibold text-ink">Your toolkit</h2>
        <p className="mb-4 text-sm text-muted">
          Small resets, made for study breaks. They actually help — give one a minute.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ToolCard
            icon={<Wind className="h-5 w-5" />}
            title="Box breathing"
            desc="Calm a racing mind"
            hue="99 76 196"
            onClick={() => {
              setBreathing(true);
              logCoping("breathing");
            }}
          />
          <ToolCard
            icon={<Eye className="h-5 w-5" />}
            title="5-4-3-2-1"
            desc="Ground a panic spike"
            hue="38 192 176"
            onClick={() => toggleTool("grounding")}
            active={tool === "grounding"}
          />
          <ToolCard
            icon={<RefreshCw className="h-5 w-5" />}
            title="Reframe"
            desc="Soften a harsh thought"
            hue="244 158 120"
            onClick={() => toggleTool("reframe")}
            active={tool === "reframe"}
          />
          <ToolCard
            icon={<Moon className="h-5 w-5" />}
            title="Wind down"
            desc="For racing-mind nights"
            hue="122 150 235"
            onClick={() => toggleTool("sleep")}
            active={tool === "sleep"}
          />
        </div>

        {tool && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="card mt-3 overflow-hidden p-5"
          >
            <p className="text-pretty leading-relaxed text-ink">{TOOL_TIPS[tool]}</p>
          </motion.div>
        )}
      </div>

      <p className="mt-10 text-center text-xs text-faint">
        Sukoon holds space for you — it isn't a doctor. If things feel unsafe, call
        Tele-MANAS <span className="font-semibold text-muted">14416</span> (24×7).
      </p>

      <BreathingTool open={breathing} onClose={() => setBreathing(false)} onComplete={() => {}} />
    </div>
  );

  function toggleTool(t: string) {
    setTool((cur) => (cur === t ? null : t));
    if (tool !== t) logCoping(t);
  }
}

const TOOL_TIPS: Record<string, string> = {
  grounding:
    "Look around and name them slowly: 5 things you can see, 4 you can hear, 3 you can touch, 2 you can smell, 1 you can taste. This pulls your brain out of the 'what-if' spiral and back into the room. You're safe right now.",
  reframe:
    "Catch the harsh thought (\"I'll never clear this\"). Now ask: would you say it to a friend? Rewrite it kinder and truer — \"This topic is hard today, and I can take it one question at a time.\" Same situation, less weight.",
  sleep:
    "Put the phone across the room. Slow your breathing — out longer than in. If your mind keeps revising the syllabus, write tomorrow's 3 tasks on paper so your brain can let go. Rest is part of the prep, not a betrayal of it.",
};

function Stat({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "good" | "caution" | "accent" | "primary";
}) {
  const toneCls: Record<string, string> = {
    good: "text-good bg-good/10",
    caution: "text-caution bg-caution/10",
    accent: "text-accent bg-accent/10",
    primary: "text-primary bg-primary-soft",
  };
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("grid h-7 w-7 place-items-center rounded-full", toneCls[tone])}>{icon}</span>
        <span className="text-xs font-medium text-faint">{label}</span>
      </div>
      <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  );
}

function ToolCard({
  icon,
  title,
  desc,
  hue,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  hue: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "card group p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift",
        active && "ring-2 ring-primary/40",
      )}
    >
      <span
        className="mb-3 grid h-10 w-10 place-items-center rounded-xl text-white"
        style={{ backgroundImage: `linear-gradient(135deg, rgb(${hue}), rgb(${hue} / 0.7))` }}
      >
        {icon}
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-xs text-muted">{desc}</p>
    </button>
  );
}

function computeStreak(checkins: MoodCheckin[]): number {
  if (!checkins.length) return 0;
  const days = new Set(checkins.map((c) => c.ts.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  // allow today or yesterday to start the streak
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}
