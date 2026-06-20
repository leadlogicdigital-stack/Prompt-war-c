"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircleHeart, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Today", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageCircleHeart },
  { href: "/voice", label: "Voice", icon: Phone },
];

export function NavBar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link href="/dashboard" aria-label="Sukoon home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-line bg-surface/80 p-1 shadow-soft">
          {LINKS.map((l) => {
            const active = path === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  active ? "bg-primary text-white shadow-soft" : "text-muted hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
