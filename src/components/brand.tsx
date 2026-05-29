import Link from "next/link";
import { cn } from "@/lib/format";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 font-bold", className)}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-accent text-[#04241a] shadow-lg shadow-brand/30">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none">
          <path
            d="M4 4h16v5a8 8 0 0 1-8 8 8 8 0 0 1-8-8V4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 9.5 11 12l4-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-lg tracking-tight text-ink">
        Vault<span className="text-brand-soft">Bets</span>
        <span className="ml-1 text-xs font-semibold text-accent-soft">AI</span>
      </span>
    </Link>
  );
}

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-xs leading-relaxed text-faint",
        className,
      )}
    >
      <span className="font-semibold text-muted">Disclaimer:</span> VaultBets AI
      provides educational analysis and research only. Nothing on this website
      constitutes financial advice, betting advice, or a recommendation to place
      a wager. Users are responsible for their own decisions.
    </p>
  );
}
