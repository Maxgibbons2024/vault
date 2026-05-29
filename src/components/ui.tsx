import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/80 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

type BadgeTone = "brand" | "accent" | "danger" | "warn" | "neutral";
const badgeTones: Record<BadgeTone, string> = {
  brand: "bg-brand/15 text-brand-soft border-brand/30",
  accent: "bg-accent/15 text-accent-soft border-accent/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  warn: "bg-warn/15 text-warn border-warn/30",
  neutral: "bg-white/5 text-muted border-border",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type ButtonVariant = "primary" | "accent" | "ghost" | "outline";
const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/20",
  accent: "bg-accent text-[#04241a] hover:brightness-110",
  ghost: "text-muted hover:text-ink hover:bg-white/5",
  outline:
    "border border-border text-ink hover:border-brand/50 hover:bg-white/5",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

type CommonBtn = {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: CommonBtn & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition",
        buttonVariants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonBtn & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed",
        buttonVariants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "brand",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "brand" | "accent" | "warn" | "neutral";
  icon?: ReactNode;
}) {
  const ring = {
    brand: "from-brand/20",
    accent: "from-accent/20",
    warn: "from-warn/20",
    neutral: "from-white/10",
  }[tone];
  return (
    <Card className="relative overflow-hidden p-5">
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br to-transparent blur-2xl",
          ring,
        )}
      />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        {icon && <span className="text-lg opacity-80">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </Card>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const tone =
    value >= 70 ? "bg-accent" : value >= 50 ? "bg-brand" : "bg-warn";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">Market Confidence</span>
        <span className="font-semibold text-ink">{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="mt-2 max-w-2xl text-muted">{subtitle}</p>}
    </div>
  );
}
