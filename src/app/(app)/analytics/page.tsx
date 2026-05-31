import { listEvents, listTenantPicks, performanceStats } from "@/lib/store";
import { getTenant } from "@/lib/tenant";
import { Badge, Card, SectionHeading, StatCard } from "@/components/ui";
import { SPORTS } from "@/lib/types";
import { formatDate } from "@/lib/format";

const statusTone = {
  won: "accent",
  lost: "danger",
  pending: "warn",
  void: "neutral",
} as const;

export default async function AnalyticsPage() {
  const tenant = await getTenant();
  const [picks, perf, events] = await Promise.all([
    tenant ? listTenantPicks(tenant.id) : Promise.resolve([]),
    performanceStats(tenant?.id),
    listEvents(),
  ]);
  const eventById = new Map(events.map((e) => [e.id, e]));

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Track record"
        title="Analytics"
        subtitle="Every pick this channel has issued, with result and ROI. Full transparency, settled and pending."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Win Rate" value={`${perf.winRate.toFixed(1)}%`} tone="accent" hint={`${perf.wins}W · ${perf.losses}L`} />
        <StatCard label="Settled Picks" value={perf.settled} tone="brand" />
        <StatCard label="Total ROI" value={`${perf.totalRoi.toFixed(0)}%`} tone={perf.totalRoi >= 0 ? "accent" : "warn"} hint="Cumulative, 1u stakes" />
        <StatCard label="Avg ROI / Pick" value={`${perf.avgRoi.toFixed(0)}%`} tone="neutral" />
      </div>

      {picks.length === 0 ? (
        <Card className="p-10 text-center text-muted">
          No picks issued yet. They&apos;ll appear here as the strategy finds value
          and settle once events finish.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Sport</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Pick</th>
                  <th className="px-4 py-3 text-right font-medium">Best Odds</th>
                  <th className="px-4 py-3 text-right font-medium">Fair Odds</th>
                  <th className="px-4 py-3 text-center font-medium">Result</th>
                  <th className="px-4 py-3 text-right font-medium">ROI</th>
                </tr>
              </thead>
              <tbody>
                {picks.map((p) => {
                  const event = eventById.get(p.eventId);
                  const sport = event ? SPORTS.find((s) => s.id === event.sport) : undefined;
                  return (
                    <tr key={p.id} className="border-b border-border/60 last:border-0 transition hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(p.createdAt, false)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{sport?.icon} {sport?.label}</td>
                      <td className="px-4 py-3 font-medium text-ink">
                        {event ? `${event.homeName} v ${event.awayName}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">{p.market}</td>
                      <td className="px-4 py-3 text-right font-mono text-ink">{p.bestPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted">{p.fairOdds.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge tone={statusTone[p.status]} className="capitalize">{p.status}</Badge>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-semibold ${
                          p.status === "pending" || p.status === "void"
                            ? "text-faint"
                            : p.roi >= 0
                              ? "text-accent-soft"
                              : "text-danger"
                        }`}
                      >
                        {p.status === "pending" || p.status === "void" ? "—" : `${p.roi > 0 ? "+" : ""}${p.roi}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="text-xs text-faint">
        Past performance is not indicative of future results. All figures are for
        educational and informational purposes only.
      </p>
    </div>
  );
}
