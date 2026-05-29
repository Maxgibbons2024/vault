import { Badge, Card } from "./ui";
import type { Opportunity } from "@/lib/types";

export function OpportunityCard({ op }: { op: Opportunity }) {
  const confTone =
    op.confidence >= 7 ? "accent" : op.confidence >= 5.5 ? "brand" : "warn";
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-faint">Market</p>
          <p className="mt-0.5 font-semibold text-ink">{op.market}</p>
        </div>
        <Badge tone={op.edgePct > 0 ? "accent" : "danger"}>
          {op.edgePct > 0 ? "+" : ""}
          {op.edgePct}% edge
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="Bookmaker" value={op.bookmakerOdds.toFixed(2)} />
        <Metric label="Fair odds" value={op.fairOdds.toFixed(2)} />
        <Metric
          label="Confidence"
          value={`${op.confidence.toFixed(1)}/10`}
          tone={confTone}
        />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-bg-soft/50 p-3">
        <p className="text-xs uppercase tracking-wide text-faint">Reasoning</p>
        <p className="mt-1 text-sm text-muted">{op.reasoning}</p>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "brand" | "accent" | "warn";
}) {
  const color = {
    neutral: "text-ink",
    brand: "text-brand-soft",
    accent: "text-accent-soft",
    warn: "text-warn",
  }[tone];
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-faint">{label}</p>
      <p className={`mt-1 font-mono text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
