import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import { Card } from "./ui";
import type { MarketOutcome } from "@/lib/types";

// Compact stat tile: big number + label, optional sub + tone.
export function MetricTile({
  label,
  value,
  sub,
  tone = "ink",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: "ink" | "brand" | "accent" | "warn" | "danger";
}) {
  const color = {
    ink: "text-ink",
    brand: "text-brand-soft",
    accent: "text-accent-soft",
    warn: "text-warn",
    danger: "text-danger",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-bg-soft/40 p-4">
      <p className="text-[11px] uppercase tracking-wide text-faint">{label}</p>
      <p className={cn("mt-1 font-mono text-2xl font-bold", color)}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-faint">{sub}</p>}
    </div>
  );
}

const SEG = ["bg-brand", "bg-faint", "bg-accent"];

// Stacked probability bar across mutually-exclusive outcomes (de-vig consensus).
export function ProbabilityBar({ outcomes }: { outcomes: MarketOutcome[] }) {
  const total = outcomes.reduce((s, o) => s + o.fairProb, 0) || 1;
  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-lg">
        {outcomes.map((o, i) => (
          <div
            key={o.name}
            className={cn(SEG[i % SEG.length], "h-full")}
            style={{ width: `${(o.fairProb / total) * 100}%` }}
            title={`${o.name}: ${(o.fairProb * 100).toFixed(0)}%`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {outcomes.map((o, i) => (
          <div key={o.name} className="flex items-center gap-1.5 text-xs">
            <span className={cn("h-2 w-2 rounded-full", SEG[i % SEG.length])} />
            <span className="text-muted">{o.name}</span>
            <span className="font-mono font-semibold text-ink">
              {(o.fairProb * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// A single edge magnitude bar (positive = value).
export function EdgeBar({ edgePct }: { edgePct: number }) {
  const pos = edgePct > 0;
  const width = Math.min(Math.abs(edgePct) * 3, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={cn("h-full rounded-full", pos ? "bg-accent" : "bg-danger")}
          style={{ width: `${width}%` }}
        />
      </div>
      <span
        className={cn(
          "font-mono text-xs font-semibold",
          pos ? "text-accent-soft" : "text-danger",
        )}
      >
        {pos ? "+" : ""}
        {edgePct}%
      </span>
    </div>
  );
}

// Odds comparison table: market best vs no-vig fair, with edge per outcome.
export function OddsCompareTable({ rows }: { rows: MarketOutcome[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-faint">
            <th className="px-4 py-2.5 font-medium">Outcome</th>
            <th className="px-4 py-2.5 text-right font-medium">Implied</th>
            <th className="px-4 py-2.5 text-right font-medium">Fair odds</th>
            <th className="px-4 py-2.5 text-right font-medium">Best price</th>
            <th className="px-4 py-2.5 text-right font-medium">Edge</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.name} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-2.5 font-medium text-ink">{o.name}</td>
              <td className="px-4 py-2.5 text-right font-mono text-muted">
                {(o.fairProb * 100).toFixed(0)}%
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-muted">
                {o.fairOdds.toFixed(2)}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-ink">
                {o.bestPrice.toFixed(2)}
              </td>
              <td
                className={cn(
                  "px-4 py-2.5 text-right font-mono font-semibold",
                  o.edgePct > 0 ? "text-accent-soft" : "text-faint",
                )}
              >
                {o.edgePct > 0 ? "+" : ""}
                {o.edgePct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
