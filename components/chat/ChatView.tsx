"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { Mark } from "@/components/brand/Logo";
import { HelplineCard } from "@/components/safety/HelplineCard";
import { useSukoon } from "@/lib/store";
import { detectCrisis } from "@/lib/safety/helplines";
import { cn, uid } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export function ChatView() {
  const { state, pushMessage, patchMessage, pendingProactive, markProactiveSeen } = useSukoon();
  const messages = state.conversation.messages;
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const deliveredRef = useRef(false);

  // deliver a pending proactive opener as Sukoon's message
  useEffect(() => {
    if (deliveredRef.current) return;
    const ev = pendingProactive();
    if (ev) {
      deliveredRef.current = true;
      pushMessage({
        id: uid("msg"),
        role: "assistant",
        content: ev.opener,
        ts: new Date().toISOString(),
      });
      markProactiveSeen(ev.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    const risk = detectCrisis(text);
    const userMsg: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content: text,
      ts: new Date().toISOString(),
      risk,
    };
    pushMessage(userMsg);

    const assistantId = uid("msg");
    pushMessage({ id: assistantId, role: "assistant", content: "", ts: new Date().toISOString() });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careProfile: state.careProfile,
          messages: [...messages, userMsg],
          recent: state.checkins.slice(0, 5),
        }),
      });
      const serverRisk = res.headers.get("x-sukoon-risk") === "1";

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          patchMessage(assistantId, { content: acc });
        }
      }
      if (risk || serverRisk) patchMessage(assistantId, { helplines: true, risk: true });
    } catch {
      patchMessage(assistantId, {
        content:
          "I'm having trouble reaching my words right now, but I'm still here with you. Try me again in a moment? 🤍",
      });
    } finally {
      setSending(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="thin-scroll flex-1 space-y-4 overflow-y-auto px-1 py-4">
        {empty && <EmptyChat />}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <Bubble key={m.id} m={m} />
          ))}
        </AnimatePresence>
        {sending && messages.at(-1)?.content === "" && <Typing />}
      </div>

      <div className="border-t border-line/70 pt-3">
        <div className="flex items-end gap-2 rounded-3xl border border-line bg-surface p-2 shadow-soft focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Tell Sukoon what's on your mind…"
            className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-ink outline-none placeholder:text-faint"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="btn-primary !px-3.5 !py-3"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 px-2 text-center text-[11px] text-faint">
          Sukoon is a wellbeing companion, not a medical service. In crisis, call Tele-MANAS 14416.
        </p>
      </div>
    </div>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  const isUser = m.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {!isUser && (
        <div className="mt-0.5 shrink-0">
          <Mark className="h-8 w-8" />
        </div>
      )}
      <div className={cn("max-w-[82%] space-y-2", isUser && "items-end")}>
        <div
          className={cn(
            "whitespace-pre-wrap rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed shadow-soft",
            isUser
              ? "rounded-br-lg bg-primary text-white"
              : "rounded-bl-lg border border-line bg-surface text-ink",
          )}
        >
          {m.content || "…"}
        </div>
        {m.helplines && <HelplineCard />}
      </div>
    </motion.div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-2.5">
      <Mark className="h-8 w-8" />
      <div className="rounded-3xl rounded-bl-lg border border-line bg-surface px-4 py-3">
        <div className="typing">
          <span /> <span /> <span />
        </div>
      </div>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center pt-16 text-center">
      <Mark className="h-14 w-14 animate-float" />
      <h3 className="mt-4 font-display text-xl font-semibold text-ink">I'm here, always.</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted">
        Vent, panic, celebrate, or just say hi. No judgement, no marks.
      </p>
    </div>
  );
}
