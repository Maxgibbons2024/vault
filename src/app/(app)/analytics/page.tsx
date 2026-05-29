import { listResults, performanceStats } from "@/lib/store";
import { Badge, Card, SectionHeading, StatCard } from "@/components/ui";
import { SPORTS, type ResultStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

const statusTone: Record<ResultStatus, "accent" | "danger" | "warn"> = {
  won: "accent",
  lost: "danger",
  pending: "warn",
};

export default async function AnalyticsPage() {
  const [rows, perf] = await Promise.all([listResults(), performanceStats()]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Track record"
        title="Analytics"
        subtitle="Historical recommendations with results and ROI. Full transparency, settled and pending."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Win Rate" value={`${perf.winRate.toFixed(1)}%`} tone="accent" hint={`${perf.wins}W · ${perf.losses}L`} />
        <StatCard label="Settled Picks" value={perf.settled} tone="brand" />
        <StatCard label="Total ROI" value={`${perf.totalRoi.toFixed(0)}%`} tone={perf.totalRoi >= 0 ? "accent" : "warn"} hint="Cumulative, 1u stakes" />
        <StatCard label="Avg ROI / Pick" value={`${perf.avgRoi.toFixed(0)}%`} tone="neutral" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Sport</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Opportunity</th>
                <th className="px-4 py-3 text-right font-medium">Market Odds</th>
                <th className="px-4 py-3 text-right font-medium">Fair Odds</th>
                <th className="px-4 py-3 text-center font-medium">Result</th>
                <th className="px-4 py-3 text-right font-medium">ROI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const sport = SPORTS.find((s) => s.id === r.sport);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 last:border-0 transition hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {formatDate(r.date, false)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {sport?.icon} {sport?.label}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{r.event}</td>
                    <td className="px-4 py-3 text-muted">{r.opportunity}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink">{r.marketOdds.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted">{r.fairOdds.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge tone={statusTone[r.status]} className="capitalize">{r.status}</Badge>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-semibold ${
                        r.status === "pending"
                          ? "text-faint"
                          : r.roi >= 0
                            ? "text-accent-soft"
                            : "text-danger"
                      }`}
                    >
                      {r.status === "pending" ? "—" : `${r.roi > 0 ? "+" : ""}${r.roi}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-faint">
        Past performance is not indicative of future results. All figures are for
        educational and informational purposes only.
      </p>
    </div>
  );
}
