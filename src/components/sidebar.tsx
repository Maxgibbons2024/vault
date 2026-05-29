"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./brand";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/football", label: "Football", icon: "⚽" },
  { href: "/tennis", label: "Tennis", icon: "🎾" },
  { href: "/ufc", label: "UFC", icon: "🥊" },
  { href: "/horse-racing", label: "Horse Racing", icon: "🐎" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/account", label: "My Account", icon: "⚙" },
];

export function Sidebar({
  user,
  plan,
  isAdmin,
}: {
  user: { name: string };
  plan: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const isFree = plan.toLowerCase() === "free";

  const links = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-brand/15 text-ink shadow-[inset_0_0_0_1px] shadow-brand/30"
                : "text-muted hover:bg-white/5 hover:text-ink",
            )}
          >
            <span className="w-5 text-center text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className={cn(
            "mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            pathname.startsWith("/admin")
              ? "bg-accent/15 text-ink shadow-[inset_0_0_0_1px] shadow-accent/30"
              : "text-muted hover:bg-white/5 hover:text-ink",
          )}
        >
          <span className="w-5 text-center text-base">🛡</span>
          Admin
        </Link>
      )}
    </nav>
  );

  const inner = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2">
        <Logo href="/dashboard" />
      </div>

      {links}

      {isFree && (
        <Link
          href="/upgrade"
          onClick={() => setOpen(false)}
          className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 to-accent/10 p-4 transition hover:border-brand/50"
        >
          <p className="text-sm font-semibold text-ink">Unlock Pro</p>
          <p className="mt-1 text-xs text-muted">
            Full analysis across every sport and unlimited value opportunities.
          </p>
          <span className="mt-3 inline-block text-xs font-semibold text-brand-soft">
            Upgrade now →
          </span>
        </Link>
      )}

      <div className="rounded-xl border border-border bg-bg-soft/60 p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand/20 text-sm font-bold text-brand-soft">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <p className="text-xs capitalize text-faint">{plan} plan</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-danger/40 hover:text-danger"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <Logo href="/dashboard" />
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          className="rounded-lg border border-border p-2 text-muted"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card">
            {inner}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-card/60 md:block">
        {inner}
      </aside>
    </>
  );
}
