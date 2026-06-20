"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { ToolShell } from "./ToolShell";
import { useSukoon } from "@/lib/store";

const FALLBACK =
  "That thought feels true right now, but it isn't the whole story. This is one hard moment, not a verdict on you — and you can take the next small step, one question at a time.";

export function ReframeTool({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const { state } = useSukoon();
  const [step, setStep] = useState(0);
  const [thought, setThought] = useState("");
  const [reframe, setReframe] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setThought("");
      setReframe("");
      setLoading(false);
    }
  }, [open]);

  async function soften() {
    setLoading(true);
    setStep(2);
    try {
      const res = await fetch("/api/reframe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thought, careProfile: state.careProfile }),
      });
      const d = await res.json();
      setReframe(d.reframe || FALLBACK);
    } catch {
      setReframe(FALLBACK);
    }
    setLoading(false);
  }

  function finish() {
    onComplete();
    onClose();
  }

  return (
    <ToolShell open={open} onClose={onClose} label="Reframe a thought">
      {step === 0 && (
        <div>
          <h3 className="font-display text-xl font-semibold text-ink">What&apos;s the harsh thought?</h3>
          <p className="mt-1 text-sm text-muted">The one looping in your head — write it as it sounds.</p>
          <textarea
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            rows={3}
            placeholder="e.g. I'll never clear this, everyone's ahead of me…"
            className="mt-3 w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
          <button
            onClick={() => setStep(1)}
            disabled={!thought.trim()}
            className="btn-primary mt-4 w-full"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm italic text-muted">
            &ldquo;{thought}&rdquo;
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-ink">
            Would you say that to a friend?
          </h3>
          <p className="mt-1 text-sm text-muted">
            Probably not — you&apos;d be gentler. Let&apos;s find words that are kinder and still true.
          </p>
          <button onClick={soften} className="btn-primary mt-5 w-full">
            <Sparkles className="h-4 w-4" /> Soften this thought
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="text-center">
          {loading ? (
            <div className="py-8">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted">Finding gentler words…</p>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-5 text-left"
              >
                <p className="text-pretty text-lg leading-relaxed text-ink">{reframe}</p>
              </motion.div>
              <button onClick={finish} className="btn-primary mt-5 w-full">
                <Check className="h-4 w-4" /> Keep this
              </button>
            </>
          )}
        </div>
      )}
    </ToolShell>
  );
}
