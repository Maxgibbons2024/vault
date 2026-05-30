import { generateAnalysis } from "./ai/analysis";
import { getAnalysisForEvent, listOpportunitiesForEvent, upsertAnalysis } from "./store";
import type { Analysis, Event } from "./types";

// Returns the event's analysis, generating + caching it on first request.
// Keeps ingestion fast (no prose generation in the hot loop) and only spends
// generation effort on events users actually open.
export async function ensureAnalysis(event: Event): Promise<Analysis> {
  const existing = await getAnalysisForEvent(event.id);
  if (existing) return existing;

  const opportunities = await listOpportunitiesForEvent(event.id);
  const metrics = event.metrics;
  const outcomes = metrics?.outcomes ?? [];
  const favourite = [...outcomes].sort((a, b) => b.fairProb - a.fairProb)[0];

  const generated = await generateAnalysis({
    sport: event.sport,
    competition: event.competition,
    homeName: event.homeName,
    awayName: event.awayName,
    startsAt: event.startsAt,
    venue: event.venue ?? null,
    market: metrics
      ? {
          bookmakerCount: metrics.bookmakerCount,
          outcomes,
          totals: metrics.totals,
          favourite: favourite
            ? { name: favourite.name, prob: favourite.fairProb }
            : undefined,
        }
      : undefined,
    opportunities: opportunities.map((o) => ({
      market: o.market,
      bookmakerOdds: o.bookmakerOdds,
      fairOdds: o.fairOdds,
      edgePct: o.edgePct,
      confidence: o.confidence,
    })),
  });

  return upsertAnalysis({
    id: `an_${event.id}`,
    eventId: event.id,
    premium: true,
    published: true,
    publishedAt: new Date().toISOString(),
    summary: generated.summary,
    sections: generated.sections,
    generatedBy: generated.generatedBy,
  });
}
