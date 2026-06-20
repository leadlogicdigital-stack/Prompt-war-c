"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { ToolShell } from "./ToolShell";

export function WorryParkTool({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [text, setText] = useState("");
  const [released, setReleased] = useState(false);
  const [secs, setSecs] = useState(60);

  useEffect(() => {
    if (open) {
      setText("");
      setReleased(false);
      setSecs(60);
    }
  }, [open]);

  useEffect(() => {
    if (!open || released || secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, released, secs]);

  function finish() {
    onComplete();
    onClose();
  }

  return (
    <ToolShell open={open} onClose={onClose} label="Worry park">
      <AnimatePresence mode="wait">
        {!released ? (
          <motion.div key="dump" exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-ink">Let it all out.</h3>
              <span className="tabular-nums text-sm font-semibold text-faint">{secs}s</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Dump every worry racing in your head. Don&apos;t filter it. This is never saved.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              autoFocus
              placeholder="Everything that's on your mind right now…"
              className="mt-3 w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            />
            <button
              onClick={() => setReleased(true)}
              disabled={!text.trim()}
              className="btn-primary mt-4 w-full"
            >
              Set it down
            </button>
          </motion.div>
        ) : (
          <motion.div key="release" className="text-center">
            <div className="relative grid h-40 place-items-center overflow-hidden">
              <motion.p
                initial={{ opacity: 0.85, y: 0 }}
                animate={{ opacity: 0, y: -130, scale: 0.9 }}
                transition={{ duration: 2.2, ease: "easeOut" }}
                className="absolute max-w-xs px-4 text-sm text-muted"
              >
                {text}
              </motion.p>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="text-5xl"
              >
                🎈
              </motion.div>
            </div>
            <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
              It&apos;s set down — for now.
            </h3>
            <p className="mt-2 text-sm text-muted">
              You can pick it back up later if you truly need to. But not this minute. This minute is
              yours.
            </p>
            <button onClick={finish} className="btn-primary mt-6 w-full">
              <Check className="h-4 w-4" /> Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolShell>
  );
}
