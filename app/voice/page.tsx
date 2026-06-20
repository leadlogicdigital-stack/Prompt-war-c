"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/app/NavBar";
import { VoiceCompanion } from "@/components/voice/VoiceCompanion";
import { useSukoon } from "@/lib/store";
import { Mark } from "@/components/brand/Logo";

export default function VoicePage() {
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
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden">
        <VoiceCompanion />
      </main>
    </div>
  );
}
