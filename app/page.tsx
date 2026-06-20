"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSukoon } from "@/lib/store";
import { Mark } from "@/components/brand/Logo";

export default function Gate() {
  const { state, ready } = useSukoon();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(state.careProfile ? "/dashboard" : "/onboarding");
  }, [ready, state.careProfile, router]);

  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center">
        <Mark className="h-14 w-14 animate-breathe" />
        <p className="mt-4 font-display text-lg text-muted">Sukoon</p>
      </div>
    </div>
  );
}
