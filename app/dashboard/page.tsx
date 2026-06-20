"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/app/NavBar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useSukoon } from "@/lib/store";
import { Mark } from "@/components/brand/Logo";

export default function DashboardPage() {
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
    <>
      <NavBar />
      <main>
        <Dashboard />
      </main>
    </>
  );
}
