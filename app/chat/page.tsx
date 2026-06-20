"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/app/NavBar";
import { ChatView } from "@/components/chat/ChatView";
import { useSukoon } from "@/lib/store";
import { Mark } from "@/components/brand/Logo";

export default function ChatPage() {
  const { state, ready } = useSukoon();
  const router = useRouter();

  useEffect(() => {
    if (ready && !state.careProfile) router.replace("/onboarding");
  }, [ready, state.careProfile, router]);

  if (!ready || !state.careProfile) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Mark className="h-12 w-12 animate-breathe" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <NavBar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-5 pb-4">
        <ChatView />
      </main>
    </div>
  );
}
