import { getCurrentUser } from "@/lib/auth";
import {
  dashboardStats,
  listEventsWithMeta,
  performanceStats,
} from "@/lib/store";
import { SectionHeading, StatCard, Badge, ButtonLink, Card } from "@/components/ui";
import { MatchCard } from "@/components/match-card";
import { SPORTS } from "@/lib/types";

export default async function DashboardPage() {
  const [user, stats, perf, rows] = await Promise.all([
    getCurrentUser(),
    dashboardStats(),
    performanceStats(),
    listEventsWithMeta(),
  ]);
  const events = rows.map((r) => r.event);
  const featured = rows.slice(0, 6);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-brand-soft">Welcome back, {user?.name.split(" ")[0]}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Dashboard</h1>
        </div>
        <Badge tone="accent">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Live model
        </Badge>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Events Today" value={stats.eventsToday} icon="📅" tone="brand" hint="Across all sports" />
        <StatCard label="Analysis Published" value={stats.analysisPublished} icon="📝" tone="accent" hint="Full AI reports" />
        <StatCard label="Value Opportunities" value={stats.valueOpportunities} icon="🎯" tone="warn" hint="Currently live" />
        <StatCard label="Sports Covered" value={stats.sportsCovered} icon="🌍" tone="neutral" hint="Football, tennis, UFC, racing" />
      </div>

      {/* Performance snapshot */}
      <Card className="grid gap-6 p-6 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted">Tracked win rate</p>
          <p className="mt-1 text-2xl font-bold text-accent-soft">{perf.winRate.toFixed(1)}%</p>
          <p className="text-xs text-faint">{perf.wins}W · {perf.losses}L settled</p>
        </div>
        <div>
          <p className="text-sm text-muted">Average ROI / pick</p>
          <p className="mt-1 text-2xl font-bold text-ink">{perf.avgRoi.toFixed(0)}%</p>
          <p className="text-xs text-faint">On 1 unit level stakes</p>
        </div>
        <div className="flex items-center sm:justify-end">
          <ButtonLink href="/analytics" variant="outline" size="sm">
            View full analytics →
          </ButtonLink>
        </div>
      </Card>

      {/* Quick sport links */}
      <div className="grid gap-3 sm:grid-cols-4">
        {SPORTS.map((s) => {
          const count = events.filter((e) => e.sport === s.id).length;
          return (
            <ButtonLink
              key={s.id}
              href={`/${s.id}`}
              variant="outline"
              className="justify-between"
            >
              <span className="flex items-center gap-2">
                <span>{s.icon}</span> {s.label}
              </span>
              <span className="text-xs text-faint">{count}</span>
            </ButtonLink>
          );
        })}
      </div>

      {/* Featured fixtures */}
      <section>
        <SectionHeading
          eyebrow="Featured"
          title="Latest analysed fixtures"
          subtitle="The freshest events our model is evaluating right now."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(({ event, opportunities, premium }) => (
            <MatchCard
              key={event.id}
              event={event}
              opportunities={opportunities}
              premium={premium}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
