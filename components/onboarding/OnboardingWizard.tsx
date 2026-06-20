"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Slider } from "@/components/ui/Slider";
import { HelplineCard } from "@/components/safety/HelplineCard";
import {
  ATTEMPTS,
  CHECKIN_TIMES,
  COMM_STYLES,
  EXAMS,
  GAD_ITEMS,
  HELP_TYPES,
  LANGUAGES,
  PHQ_ITEMS,
  PROACTIVITY,
  PSS_ITEMS,
  SLIDERS,
  SLIDER_DEFAULTS,
  STRESSORS,
  STUDY_SETUPS,
  toSnapshot,
} from "@/lib/onboarding/config";
import { RISK_META } from "@/lib/care/scoring";
import { useSukoon } from "@/lib/store";
import { cn } from "@/lib/utils";
import type {
  AttemptStage,
  CareProfile,
  CommStyle,
  ExamType,
  Language,
  Proactivity,
  StudySetup,
} from "@/lib/types";

const STEP_TITLES = [
  "Welcome",
  "About you",
  "Right now",
  "A gentle check",
  "What weighs on you",
  "How I can help",
  "Your plan",
];

export function OnboardingWizard() {
  const router = useRouter();
  const { setProfile, addCheckin } = useSukoon();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  // identity
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState<string>("");
  const [exam, setExam] = useState<ExamType | null>(null);
  const [attempt, setAttempt] = useState<AttemptStage | null>(null);
  const [months, setMonths] = useState<string>("");
  const [studySetup, setStudySetup] = useState<StudySetup | null>(null);
  const [awayFromFamily, setAwayFromFamily] = useState<boolean | null>(null);
  const [studyHours, setStudyHours] = useState<string>("");

  // sliders
  const [sliders, setSliders] = useState<Record<string, number>>({ ...SLIDER_DEFAULTS });

  // screening
  const [phq, setPhq] = useState<number[]>([-1, -1, -1]);
  const [gad, setGad] = useState<number[]>([-1, -1]);
  const [pss, setPss] = useState<number[]>([-1, -1, -1, -1]);

  // stressors + prefs
  const [stressors, setStressors] = useState<string[]>([]);
  const [proactivity, setProactivity] = useState<Proactivity | null>(null);
  const [checkinTimes, setCheckinTimes] = useState<string[]>([]);
  const [commStyle, setCommStyle] = useState<CommStyle | null>(null);
  const [language, setLanguage] = useState<Language>("hinglish");
  const [helpTypes, setHelpTypes] = useState<string[]>([]);

  // synthesis
  const [building, setBuilding] = useState(false);
  const [profile, setLocalProfile] = useState<CareProfile | null>(null);

  const total = STEP_TITLES.length;
  const progress = Math.round((step / (total - 1)) * 100);

  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return nickname.trim().length > 0 && !!exam && !!attempt && !!studySetup && awayFromFamily !== null;
      case 3:
        return phq.every((v) => v >= 0) && gad.every((v) => v >= 0);
      case 4:
        return stressors.length > 0;
      case 5:
        return !!proactivity && !!commStyle && helpTypes.length > 0;
      default:
        return true;
    }
  }, [step, nickname, exam, attempt, studySetup, awayFromFamily, phq, gad, stressors, proactivity, commStyle, helpTypes]);

  function go(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  async function synthesize() {
    setBuilding(true);
    setDir(1);
    setStep(6);
    const payload = {
      identity: {
        nickname: nickname.trim(),
        age: age ? Number(age) : null,
        exam: exam!,
        attempt: attempt!,
        monthsToExam: months ? Number(months) : null,
        studySetup: studySetup!,
        awayFromFamily: !!awayFromFamily,
        studyHours: studyHours ? Number(studyHours) : null,
      },
      baseline: toSnapshot(sliders),
      stressors,
      screening: { phq, gad, pss },
      preferences: {
        proactivity: proactivity!,
        checkinTimes,
        commStyle: commStyle!,
        language,
        helpTypes,
      },
    };

    let cp: CareProfile | null = null;
    try {
      const res = await fetch("/api/care-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) cp = (await res.json()).careProfile as CareProfile;
    } catch {
      /* fall through to local */
    }
    if (!cp) {
      const { assembleCareProfile } = await import("@/lib/care/profile");
      cp = assembleCareProfile(payload);
    }

    setLocalProfile(cp);
    setProfile(cp);
    addCheckin(payload.baseline, undefined, "onboarding");
    setBuilding(false);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-6">
      {/* header */}
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        {step > 0 && step < 6 && (
          <span className="label">
            {step}/{total - 2} · {STEP_TITLES[step]}
          </span>
        )}
      </div>

      {/* progress */}
      {step > 0 && (
        <div className="mb-7 h-1.5 w-full overflow-hidden rounded-full bg-primary-soft">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundImage: "linear-gradient(90deg, rgb(99 76 196), rgb(38 192 176))" }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      )}

      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && <Welcome onStart={() => go(1)} />}

            {step === 1 && (
              <Section
                title={`Hi! Let's get to know you 🤍`}
                subtitle="A few quick things so Sukoon understands your world — not a form, just context."
              >
                <Field label="What should I call you?">
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Your name or nickname"
                    className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />
                </Field>

                <Field label="Which exam are you preparing for?">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {EXAMS.map((e) => (
                      <OptionCard
                        key={e.value}
                        selected={exam === e.value}
                        onClick={() => setExam(e.value)}
                        title={e.label}
                        hint={e.hint}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Where are you in the journey?">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {ATTEMPTS.map((a) => (
                      <OptionCard
                        key={a.value}
                        selected={attempt === a.value}
                        onClick={() => setAttempt(a.value)}
                        title={a.label}
                        hint={a.hint}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="How are you studying?">
                  <Chips
                    options={STUDY_SETUPS.map((s) => ({ id: s.value, label: s.label }))}
                    selected={studySetup ? [studySetup] : []}
                    onToggle={(id) => setStudySetup(id as StudySetup)}
                  />
                </Field>

                <Field label="Are you living away from family for this?">
                  <div className="flex gap-2.5">
                    {[
                      { v: true, l: "Yes, away from home" },
                      { v: false, l: "No, with family" },
                    ].map((o) => (
                      <button
                        key={String(o.v)}
                        onClick={() => setAwayFromFamily(o.v)}
                        className={cn(
                          "flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition",
                          awayFromFamily === o.v
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-line bg-surface text-muted hover:border-primary/30",
                        )}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <MiniNum label="Age" value={age} onChange={setAge} placeholder="18" />
                  <MiniNum label="Months to exam" value={months} onChange={setMonths} placeholder="8" />
                  <MiniNum label="Study hrs/day" value={studyHours} onChange={setStudyHours} placeholder="10" />
                </div>
              </Section>
            )}

            {step === 2 && (
              <Section
                title="How are you, right now?"
                subtitle="Slide each one to wherever you honestly are today. There are no wrong answers."
              >
                <div className="card divide-y divide-line/60 p-5">
                  {SLIDERS.map((s) => (
                    <Slider
                      key={s.key}
                      label={s.label}
                      prompt={s.prompt}
                      low={s.low}
                      high={s.high}
                      hue={s.hue}
                      value={sliders[s.key]}
                      onChange={(v) => setSliders((p) => ({ ...p, [s.key]: v }))}
                    />
                  ))}
                </div>
              </Section>
            )}

            {step === 3 && (
              <Section
                title="A gentle check-in"
                subtitle="These are standard wellbeing questions, asked softly. Answer honestly — it stays private, and it helps me help you."
              >
                <div className="space-y-3">
                  {PHQ_ITEMS.map((item, i) => (
                    <ScreenQuestion
                      key={`phq${i}`}
                      item={item}
                      value={phq[i]}
                      onPick={(v) => setPhq((p) => p.map((x, idx) => (idx === i ? v : x)))}
                    />
                  ))}
                  {GAD_ITEMS.map((item, i) => (
                    <ScreenQuestion
                      key={`gad${i}`}
                      item={item}
                      value={gad[i]}
                      onPick={(v) => setGad((p) => p.map((x, idx) => (idx === i ? v : x)))}
                    />
                  ))}
                  {PSS_ITEMS.map((item, i) => (
                    <ScreenQuestion
                      key={`pss${i}`}
                      item={item}
                      value={pss[i]}
                      optional
                      onPick={(v) => setPss((p) => p.map((x, idx) => (idx === i ? v : x)))}
                    />
                  ))}
                </div>
              </Section>
            )}

            {step === 4 && (
              <Section
                title="What weighs on you most?"
                subtitle="Pick whatever feels true. This is the stuff Sukoon will hold in mind for you."
              >
                <Chips
                  multi
                  big
                  options={STRESSORS.map((s) => ({ id: s.id, label: `${s.emoji}  ${s.label}` }))}
                  selected={stressors}
                  onToggle={(id) =>
                    setStressors((p) =>
                      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
                    )
                  }
                />
              </Section>
            )}

            {step === 5 && (
              <Section
                title="How can I show up for you?"
                subtitle="This shapes how — and how often — I reach out. You can change it anytime."
              >
                <Field label="How much should I check in on you?">
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {PROACTIVITY.map((p) => (
                      <OptionCard
                        key={p.value}
                        selected={proactivity === p.value}
                        onClick={() => setProactivity(p.value)}
                        title={p.label}
                        hint={p.hint}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="When are good times to reach you?">
                  <Chips
                    multi
                    options={CHECKIN_TIMES.map((c) => ({ id: c.id, label: `${c.emoji} ${c.label}` }))}
                    selected={checkinTimes}
                    onToggle={(id) =>
                      setCheckinTimes((p) =>
                        p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
                      )
                    }
                  />
                </Field>

                <Field label="What tone feels right?">
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {COMM_STYLES.map((c) => (
                      <OptionCard
                        key={c.value}
                        selected={commStyle === c.value}
                        onClick={() => setCommStyle(c.value)}
                        title={c.label}
                        hint={c.hint}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Which language feels most you?">
                  <Chips
                    options={LANGUAGES.map((l) => ({ id: l.value, label: l.hint ? `${l.label} · ${l.hint}` : l.label }))}
                    selected={[language]}
                    onToggle={(id) => setLanguage(id as Language)}
                  />
                </Field>

                <Field label="What do you most want from me?">
                  <Chips
                    multi
                    options={HELP_TYPES.map((h) => ({ id: h.id, label: `${h.emoji} ${h.label}` }))}
                    selected={helpTypes}
                    onToggle={(id) =>
                      setHelpTypes((p) =>
                        p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
                      )
                    }
                  />
                </Field>
              </Section>
            )}

            {step === 6 && (
              <SummaryStep building={building} profile={profile} onEnter={() => router.push("/dashboard")} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* nav */}
      {step > 0 && step < 6 && (
        <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 bg-gradient-to-t from-bg to-transparent pb-2 pt-3">
          <button onClick={() => go(step - 1)} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < 5 ? (
            <button onClick={() => go(step + 1)} disabled={!canNext} className="btn-primary">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={synthesize} disabled={!canNext} className="btn-primary">
              <Sparkles className="h-4 w-4" /> Build my plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── pieces ───────────────────────────────────────────────────────────

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 mt-6"
      >
        <div className="absolute inset-0 -z-10 animate-breathe rounded-full bg-primary/20 blur-2xl" />
        <div className="grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br from-primary to-accent text-5xl shadow-glow">
          🤍
        </div>
      </motion.div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Welcome to <span className="gradient-text">Sukoon</span>
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted">
        A calm corner for the exam grind. I'm here for <em>you</em> — not your rank.
        Before we begin, let me understand where you really are, so everything I do
        is shaped around you.
      </p>

      <div className="mt-7 w-full max-w-md space-y-2.5 text-left">
        {[
          ["🎚️", "A few honest sliders — how you actually feel"],
          ["🪶", "A gentle, private wellbeing check"],
          ["🧭", "Then a plan made just for you"],
        ].map(([icon, text]) => (
          <div key={text} className="card flex items-center gap-3 px-4 py-3">
            <span className="text-xl">{icon}</span>
            <span className="text-sm text-ink">{text}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-2xl border border-line bg-surface/60 px-4 py-3 text-left">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted">
          Private to you, on this device. Sukoon is a supportive companion — not a
          doctor or a substitute for professional care. By continuing you agree to use
          it as a wellbeing aid.
        </p>
      </div>

      <button onClick={onStart} className="btn-primary mt-7 w-full max-w-md py-3.5 text-base">
        I'm ready <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-1.5 text-pretty text-muted">{subtitle}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold text-ink">{label}</p>
      {children}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-3.5 py-3 text-left transition-all active:scale-[0.98]",
        selected
          ? "border-primary bg-primary-soft shadow-soft"
          : "border-line bg-surface hover:border-primary/30",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-sm font-semibold", selected ? "text-primary" : "text-ink")}>
          {title}
        </span>
        {selected && <Check className="h-4 w-4 text-primary" />}
      </div>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
    </button>
  );
}

function Chips({
  options,
  selected,
  onToggle,
  multi = false,
  big = false,
}: {
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  multi?: boolean;
  big?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", big && "gap-2.5")}>
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            onClick={() => onToggle(o.id)}
            className={cn(
              "rounded-full border font-medium transition-all active:scale-95",
              big ? "px-4 py-2.5 text-sm" : "px-3.5 py-2 text-sm",
              on
                ? "border-primary bg-primary text-white shadow-soft"
                : "border-line bg-surface text-muted hover:border-primary/40 hover:text-ink",
            )}
          >
            {o.label}
            {multi && on && <Check className="ml-1.5 inline h-3.5 w-3.5" />}
          </button>
        );
      })}
    </div>
  );
}

function MiniNum({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-faint">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-center text-ink outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

function ScreenQuestion({
  item,
  value,
  onPick,
  optional = false,
}: {
  item: { text: string; scale: string[]; safety?: boolean };
  value: number;
  onPick: (v: number) => void;
  optional?: boolean;
}) {
  return (
    <div className={cn("card p-4", item.safety && "border-primary/30 bg-primary-soft/40")}>
      <p className="text-[15px] font-medium text-ink">
        {item.text}
        {optional && <span className="ml-1.5 text-xs font-normal text-faint">(optional)</span>}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {item.scale.map((label, v) => (
          <button
            key={v}
            onClick={() => onPick(v)}
            className={cn(
              "rounded-xl border px-2 py-2 text-xs font-medium transition active:scale-95",
              value === v
                ? "border-primary bg-primary text-white"
                : "border-line bg-surface text-muted hover:border-primary/40",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryStep({
  building,
  profile,
  onEnter,
}: {
  building: boolean;
  profile: CareProfile | null;
  onEnter: () => void;
}) {
  if (building || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 -z-10 animate-breathe rounded-full bg-accent/25 blur-2xl" />
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Listening to everything you shared…
        </h2>
        <p className="mt-2 max-w-sm text-muted">
          Putting together a plan that's shaped around you, not a template.
        </p>
      </div>
    );
  }

  const meta = RISK_META[profile.riskTier];
  const showCrisis = profile.riskTier === "crisis" || profile.screeningScores.phqFlag9;

  return (
    <div className="space-y-5 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass overflow-hidden p-6"
      >
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> Here's what I'm hearing
        </div>
        <p className="text-pretty text-lg leading-relaxed text-ink">{profile.summary}</p>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-5">
          <p className="label mb-2">Where you are</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.emoji}</span>
            <div>
              <p className="text-lg font-semibold text-ink">{meta.label}</p>
              <p className="text-sm text-muted">{meta.blurb}</p>
            </div>
          </div>
        </div>
        <div className="card flex flex-col justify-center p-5">
          <p className="label mb-2">Wellness index</p>
          <div className="flex items-end gap-2">
            <span className="font-display text-4xl font-semibold text-ink">{profile.wellnessIndex}</span>
            <span className="mb-1 text-sm text-faint">/ 100 today</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-primary-soft">
            <div
              className="h-full rounded-full"
              style={{
                width: `${profile.wellnessIndex}%`,
                backgroundImage: "linear-gradient(90deg, rgb(99 76 196), rgb(38 192 176))",
              }}
            />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <p className="label mb-3">How I'll show up for you</p>
        <ul className="space-y-2 text-sm text-ink">
          <li className="flex gap-2"><span>💬</span> {planLine(profile)}</li>
          <li className="flex gap-2"><span>🔔</span> {cadenceLine(profile)}</li>
          <li className="flex gap-2"><span>🧠</span> I'll keep your pressures in mind: {profile.persona.stressorAwareness.slice(0, 3).join(", ") || "exam stress"}.</li>
        </ul>
      </div>

      {showCrisis && <HelplineCard />}

      <button onClick={onEnter} className="btn-primary w-full py-3.5 text-base">
        Enter Sukoon <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function planLine(p: CareProfile): string {
  const style =
    p.persona.tone.includes("motivat")
      ? "I'll keep you going with warmth and a push when you need it"
      : p.persona.tone.includes("direct")
        ? "I'll be straight with you, with practical steps"
        : "I'll listen first, gently, and never rush you";
  return `${style}, in ${langWord(p.preferences.language)}.`;
}

function cadenceLine(p: CareProfile): string {
  if (p.preferences.proactivity === "minimal") return "I'll wait for you to come to me — no pressure.";
  if (p.riskTier === "strained" || p.riskTier === "crisis")
    return "I'll check in a little more often, gently, while things are heavy.";
  return p.preferences.proactivity === "high"
    ? "I'll reach out daily to see how you're doing."
    : "I'll check in now and then, at the times you chose.";
}

function langWord(l: Language): string {
  return l === "hi" ? "Hindi" : l === "hinglish" ? "Hinglish" : "English";
}
