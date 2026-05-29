// Ingestion pipeline: fixtures -> odds -> model -> AI analysis -> persist.
// Runs on a schedule (see /api/ingest). Designed to be idempotent via externalId.

import { fetchFootballFixtures, apiFootballEnabled } from "./providers/api-football";
import { fetchOdds, normalizeKey, oddsApiEnabled, type MatchOdds } from "./providers/the-odds-api";
import { estimateLambdas, matchProbabilities, buildFootballOpportunities } from "./models/football";
import { generateAnalysis } from "./ai/analysis";
import {
  getAnalysisForEvent,
  replaceOpportunitiesForEvent,
  upsertAnalysis,
  upsertEventByExternalId,
} from "./store";

// Which competitions to pull. API-Football league ids + matching Odds API sport keys.
const FOOTBALL_LEAGUES: { leagueId: number; oddsSportKey: string }[] = [
  { leagueId: 39, oddsSportKey: "soccer_epl" }, // Premier League
  { leagueId: 140, oddsSportKey: "soccer_spain_la_liga" }, // LaLiga
  { leagueId: 2, oddsSportKey: "soccer_uefa_champs_league" }, // UCL
];

export interface IngestSummary {
  enabled: { fixtures: boolean; odds: boolean };
  fixturesSeen: number;
  eventsUpserted: number;
  opportunitiesCreated: number;
  analysesGenerated: number;
  notes: string[];
}

function confidenceFromProbs(p: { homeWin: number; draw: number; awayWin: number }) {
  // Higher when one outcome dominates; expressed 0-100 for the event card.
  const top = Math.max(p.homeWin, p.draw, p.awayWin);
  return Math.round(40 + top * 55);
}

export async function runIngestion(): Promise<IngestSummary> {
  const summary: IngestSummary = {
    enabled: { fixtures: apiFootballEnabled, odds: oddsApiEnabled },
    fixturesSeen: 0,
    eventsUpserted: 0,
    opportunitiesCreated: 0,
    analysesGenerated: 0,
    notes: [],
  };

  if (!apiFootballEnabled) {
    summary.notes.push(
      "API_FOOTBALL_KEY not set — no live fixtures ingested (running on seed data).",
    );
    return summary;
  }

  // Free API-Football plans only cover seasons 2021–2023. Override the season
  // and an explicit in-season date window via env to demo on a covered season.
  const season = Number(process.env.FOOTBALL_SEASON) || new Date().getUTCFullYear();
  const from = process.env.FOOTBALL_FROM || undefined;
  const to = process.env.FOOTBALL_TO || undefined;

  for (const league of FOOTBALL_LEAGUES) {
    const fixtures = await fetchFootballFixtures({
      leagueIds: [league.leagueId],
      season,
      toDays: 7,
      from,
      to,
    });
    summary.fixturesSeen += fixtures.length;

    const oddsMap = oddsApiEnabled
      ? await fetchOdds(league.oddsSportKey)
      : new Map<string, MatchOdds>();

    for (const fx of fixtures) {
      // 1) Model
      const { lambdaHome, lambdaAway } = estimateLambdas({});
      const probs = matchProbabilities(lambdaHome, lambdaAway);
      const odds = oddsMap.get(normalizeKey(fx.homeName, fx.awayName)) ?? {};
      const opps = buildFootballOpportunities(fx.homeName, fx.awayName, probs, odds);

      // 2) Persist event
      const event = await upsertEventByExternalId({
        externalId: fx.externalId,
        sport: "football",
        competition: fx.competition,
        homeName: fx.homeName,
        awayName: fx.awayName,
        startsAt: fx.startsAt,
        venue: fx.venue,
        marketConfidence: confidenceFromProbs(probs),
        status: fx.status,
      });
      summary.eventsUpserted += 1;

      // 3) Opportunities
      await replaceOpportunitiesForEvent(event.id, opps);
      summary.opportunitiesCreated += opps.length;

      // 4) AI analysis. Generate for scheduled matches, or the first time we see
      // any match (so historical/free-tier demos are populated too).
      const hasAnalysis = await getAnalysisForEvent(event.id);
      if (fx.status === "scheduled" || !hasAnalysis) {
        const generated = await generateAnalysis({
          sport: "football",
          competition: fx.competition,
          homeName: fx.homeName,
          awayName: fx.awayName,
          startsAt: fx.startsAt,
          probabilities: { ...probs },
          opportunities: opps.map((o) => ({
            market: o.market,
            bookmakerOdds: o.bookmakerOdds,
            fairOdds: o.fairOdds,
            edgePct: o.edgePct,
          })),
        });
        await upsertAnalysis({
          id: hasAnalysis?.id ?? `an_${event.id}`,
          eventId: event.id,
          premium: hasAnalysis?.premium ?? true,
          published: hasAnalysis?.published ?? true,
          publishedAt: hasAnalysis?.publishedAt ?? new Date().toISOString(),
          summary: generated.summary,
          sections: generated.sections,
          generatedBy: generated.generatedBy,
        });
        summary.analysesGenerated += 1;
      }
    }
  }

  return summary;
}
