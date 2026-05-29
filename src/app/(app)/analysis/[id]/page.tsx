import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getAnalysisForEvent,
  getEvent,
  hasPremiumAccess,
  listOpportunitiesForEvent,
} from "@/lib/store";
import { Badge, ButtonLink, Card, ConfidenceMeter, SectionHeading } from "@/components/ui";
import { OpportunityCard } from "@/components/opportunity-card";
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

  const [user, analysis, opportunities] = await Promise.all([
    getCurrentUser(),
    getAnalysisForEvent(id),
    listOpportunitiesForEvent(id),
  ]);
  const meta = SPORTS.find((s) => s.id === event.sport)!;

  const locked = !!analysis?.premium && !(await hasPremiumAccess(user?.id));

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
            {analysis?.premium && <Badge tone="accent">Premium analysis</Badge>}
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

          <div className="mx-auto mt-6 max-w-sm">
            <ConfidenceMeter value={event.marketConfidence} />
          </div>
        </div>
      </Card>

      {!analysis ? (
        <Card className="p-10 text-center text-muted">
          Analysis for this event has not been published yet.
        </Card>
      ) : locked ? (
        <LockedGate summary={analysis.summary} opportunities={opportunities.length} />
      ) : (
        <>
          {/* AI summary */}
          <section>
            <SectionHeading eyebrow="AI Analysis" title="Summary" />
            <Card className="mt-4 border-brand/30 p-6">
              <p className="text-muted">{analysis.summary}</p>
            </Card>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {analysis.sections.map((s) => (
                <Card key={s.heading} className="p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    {s.heading}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Value opportunities */}
          <section>
            <SectionHeading
              eyebrow="Edges"
              title="Value Opportunities"
              subtitle="Markets where bookmaker odds diverge from our simulated fair odds."
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

          <Card className="border-warn/20 bg-warn/5 p-4">
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-semibold text-warn">Educational only.</span>{" "}
              These figures are model estimates derived from public data and do
              not constitute betting advice or a recommendation to wager.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

function LockedGate({
  summary,
  opportunities,
}: {
  summary: string;
  opportunities: number;
}) {
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-6">
        <p className="text-muted blur-[2px] select-none">{summary}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5 blur-[2px]" />
          ))}
        </div>
      </Card>

      <Card className="border-brand/40 p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-2xl">
          🔒
        </div>
        <h3 className="mt-4 text-xl font-bold text-ink">Premium analysis locked</h3>
        <p className="mx-auto mt-2 max-w-md text-muted">
          This report includes a full AI breakdown and{" "}
          <span className="text-accent-soft">{opportunities} value opportunities</span>.
          Upgrade to a paid plan to unlock it.
        </p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/upgrade" size="lg">
            Upgrade to unlock
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
