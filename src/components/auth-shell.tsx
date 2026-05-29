import type { ReactNode } from "react";
import { Logo, Disclaimer } from "@/components/brand";

export function AuthShell({
  title,
  subtitle,
  children,
  demo,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  demo?: boolean;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden border-r border-border bg-bg-soft/50 lg:block">
        <div className="vb-grid-bg absolute inset-0 opacity-40" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div>
            <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-ink">
              Turn public sports data into{" "}
              <span className="bg-gradient-to-r from-brand-soft to-accent-soft bg-clip-text text-transparent">
                a measurable edge.
              </span>
            </h2>
            <p className="mt-4 max-w-md text-muted">
              AI match analysis, fair-odds modelling and a transparent track
              record — all in one premium terminal.
            </p>
          </div>
          <Disclaimer className="max-w-md" />
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-1 text-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {demo && (
            <div className="mt-8 rounded-xl border border-border bg-bg-soft/60 p-4 text-xs text-muted">
              <p className="font-semibold text-ink">Demo accounts</p>
              <p className="mt-2">
                User · <span className="text-brand-soft">demo@vaultbets.ai</span> / demo1234
              </p>
              <p className="mt-1">
                Admin · <span className="text-accent-soft">admin@vaultbets.ai</span> / admin1234
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
