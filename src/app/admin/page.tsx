import Link from "next/link";
import {
  dashboardStats,
  listAnalyses,
  listEvents,
  listResults,
  performanceStats,
  revenueStats,
} from "@/lib/store";
import { Badge, Card, SectionHeading, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default async function AdminOverview() {
  const [rev, stats, perf, allEvents, analyses, results] = await Promise.all([
    revenueStats(),
    dashboardStats(),
    performanceStats(),
    listEvents(),
    listAnalyses(),
    listResults(),
  ]);
  const recentEvents = allEvents.slice(0, 6);
  const published = analyses.filter((a) => a.published).length;
  const drafts = analyses.length - published;

  return (
    <div className="space-y-8">
      <SectionHeading eyebrow="Admin" title="Overview" subtitle="Revenue, content and performance at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="MRR" value={`£${rev.mrr.toLocaleString()}`} tone="accent" icon="💷" hint={`${rev.paying} paying subscribers`} />
        <StatCard label="Total Users" value={rev.totalUsers} tone="brand" icon="👥" hint={`${rev.pro} Pro · ${rev.starter} Starter`} />
        <StatCard label="Published Analysis" value={published} tone="neutral" icon="📝" hint={`${drafts} drafts`} />
        <StatCard label="Tracked Win Rate" value={`${perf.winRate.toFixed(0)}%`} tone="warn" icon="🎯" hint={`${perf.settled} settled picks`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">Recent events</h3>
            <Link href="/admin/events" className="text-sm text-brand-soft hover:underline">
              Manage →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border/60">
            {recentEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {e.homeName} vs {e.awayName}
                  </p>
                  <p className="text-xs text-faint">{e.competition} · {formatDate(e.startsAt, false)}</p>
                </div>
                <Badge tone="neutral" className="capitalize">{e.sport.replace("-", " ")}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-ink">Latest results</h3>
          <ul className="mt-4 divide-y divide-border/60">
            {results.slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{r.opportunity}</p>
                  <p className="text-xs text-faint">{r.event}</p>
                </div>
                <Badge tone={r.status === "won" ? "accent" : r.status === "lost" ? "danger" : "warn"} className="capitalize">
                  {r.status}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-ink">Capabilities</h3>
        <div className="mt-3 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Create events",
            "Edit analysis",
            "Publish / unpublish analysis",
            "Delete analysis & events",
            "Manage subscribers & plans",
            "View revenue metrics",
          ].map((c) => (
            <div key={c} className="flex items-center gap-2 rounded-lg border border-border bg-bg-soft/40 px-3 py-2">
              <span className="text-accent-soft">✓</span> {c}
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-faint">
        Events today: {stats.eventsToday} · Live value opportunities: {stats.valueOpportunities}
      </p>
    </div>
  );
}
