import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getAnalysisForEvent,
  getEvent,
  hasPremiumAccess,
  listOpportunitiesForEvent,
} from "@/lib/store";
import { ensureAnalysis } from "@/lib/analysis-service";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";
import { OpportunityCard } from "@/components/opportunity-card";
import { MetricTile, ProbabilityBar, OddsCompareTable } from "@/components/viz";
import { SPORTS } from "@/lib/types";
import { formatDate, relativeDay } from "@/lib/format";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [user, existing, opportunities] = await Promise.all([
    getCurrentUser(),
    getAnalysisForEvent(id),
    listOpportunitiesForEvent(id),
  ]);
  const meta = SPORTS.find((s) => s.id === event.sport)!;

  const isPremium = existing ? existing.premium : true;
  const premiumAccess = await hasPremiumAccess(user?.id);
  const locked = isPremium && !premiumAccess;

  // Generate prose lazily, but only for users who can see it.
  const analysis = existing ?? (locked ? null : await ensureAnalysis(event));

  const metrics = event.metrics;
  const topEdge =
    opportunities.length > 0
      ? Math.max(...opportunities.map((o) => o.edgePct))
      : Math.max(0, ...(metrics?.outcomes ?? []).map((o) => o.edgePct));
  const bestValue = opportunities[0];

  return (
    <div className="space-y-8">
      <Link href={`/${event.sport}`} className="text-sm text-muted hover:text-ink">
        ← Back to {meta.label}
      </Link>

      {/* Match header */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="vb-grid-bg absolute inset-0 opacity-30" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="brand">{meta.icon} {meta.label}</Badge>
            <span className="text-sm text-muted">{event.competition}</span>
            {topEdge > 0 && <Badge tone="accent">+{topEdge}% top edge</Badge>}
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-center sm:gap-12">
            <div className="flex-1">
              <p className="text-xl font-bold text-ink sm:text-2xl">{event.homeName}</p>
            </div>
            <span className="font-mono text-sm text-faint">VS</span>
            <div className="flex-1">
              <p className="text-xl font-bold text-ink sm:text-2xl">{event.awayName}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <span>📅 {relativeDay(event.startsAt)} · {formatDate(event.startsAt)}</span>
            {event.venue && <span>📍 {event.venue}</span>}
          </div>
        </div>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label="Top edge"
          value={topEdge > 0 ? `+${topEdge}%` : "—"}
          tone={topEdge > 0 ? "accent" : "ink"}
          sub={bestValue ? bestValue.market : "No value flagged"}
        />
        <MetricTile
          label="Model confidence"
          value={`${event.marketConfidence}%`}
          tone="brand"
          sub="Favourite win prob."
        />
        <MetricTile
          label="Value markets"
          value={opportunities.length}
          tone={opportunities.length ? "accent" : "ink"}
          sub="Above edge threshold"
        />
        <MetricTile
          label="Bookmakers"
          value={metrics?.bookmakerCount ?? "—"}
          sub="In consensus"
        />
      </div>

      {/* Market read (data-forward) */}
      {metrics?.outcomes?.length ? (
        <section className="space-y-4">
          <SectionHeading eyebrow="Market read" title="Probabilities & fair odds" />
          <Card className="p-6">
            <p className="mb-3 text-sm text-muted">
              No-vig consensus across {metrics.bookmakerCount} bookmakers
            </p>
            <ProbabilityBar outcomes={metrics.outcomes} />
          </Card>
          <OddsCompareTable rows={metrics.outcomes} />
          {metrics.totals?.length ? (
            <>
              <p className="text-sm font-medium text-muted">Total goals (2.5 line)</p>
              <OddsCompareTable rows={metrics.totals} />
            </>
          ) : null}
        </section>
      ) : null}

      {locked ? (
        <LockedGate opportunities={opportunities.length} />
      ) : (
        <>
          {/* Value opportunities */}
          <section>
            <SectionHeading
              eyebrow="Edges"
              title="Value Opportunities"
              subtitle="Where the best available price beats our no-vig fair price."
            />
            {opportunities.length === 0 ? (
              <Card className="mt-4 p-8 text-center text-muted">
                No standout value opportunities flagged for this event.
              </Card>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {opportunities.map((op) => (
                  <OpportunityCard key={op.id} op={op} />
                ))}
              </div>
            )}
          </section>

          {/* AI written analysis — collapsed by default to keep the page scannable */}
          {analysis && (
            <section className="space-y-4">
              <Card className="border-brand/30 p-6">
                <div className="flex items-center gap-2">
                  <SectionHeading eyebrow="AI Analysis" title="Summary" />
                  {analysis.generatedBy === "claude" && (
                    <Badge tone="brand">Claude</Badge>
                  )}
                </div>
                <p className="mt-3 text-muted">{analysis.summary}</p>
              </Card>
              <details className="group rounded-2xl border border-border bg-card/60">
                <summary className="cursor-pointer list-none px-6 py-4 text-sm font-semibold text-ink">
                  <span className="text-brand-soft group-open:hidden">Show full written analysis ↓</span>
                  <span className="hidden text-brand-soft group-open:inline">Hide written analysis ↑</span>
                </summary>
                <div className="grid gap-4 px-6 pb-6 md:grid-cols-2">
                  {analysis.sections.map((s) => (
                    <div key={s.heading} className="rounded-xl border border-border bg-bg-soft/40 p-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                        {s.heading}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          )}

          <Card className="border-warn/20 bg-warn/5 p-4">
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-semibold text-warn">Educational only.</span>{" "}
              Figures are model estimates from public market data and do not
              constitute betting advice or a recommendation to wager.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

function LockedGate({ opportunities }: { opportunities: number }) {
  return (
    <Card className="border-brand/40 p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-2xl">
        🔒
      </div>
      <h3 className="mt-4 text-xl font-bold text-ink">Premium analysis locked</h3>
      <p className="mx-auto mt-2 max-w-md text-muted">
        Unlock the full AI breakdown and{" "}
        <span className="text-accent-soft">{opportunities} value opportunities</span>{" "}
        with their reasoning. Upgrade to a paid plan.
      </p>
      <div className="mt-6 flex justify-center">
        <ButtonLink href="/upgrade" size="lg">
          Upgrade to unlock
        </ButtonLink>
      </div>
    </Card>
  );
}
