"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import { SosOverlay } from "./SosOverlay";

export function SosButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="SOS — calm me down right now"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-alert px-5 py-3.5 font-bold text-white shadow-lift transition-transform active:scale-95"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-alert/40" />
        <HeartPulse className="h-5 w-5" />
        SOS
        <motion.span
          className="absolute -inset-1 -z-10 rounded-full bg-alert/30 blur-md"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </button>
      <SosOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
