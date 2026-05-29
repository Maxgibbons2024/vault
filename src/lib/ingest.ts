// Ingestion pipeline (Odds-API-led): upcoming events + odds -> de-vig value
// model -> AI analysis -> persist. Idempotent via externalId ("oa_<id>").
// Runs on a schedule (see /api/ingest). No team stats are required.

import {
  fetchEventsWithOdds,
  listActiveSports,
  oddsApiEnabled,
} from "./providers/the-odds-api";
import { buildDevigOpportunities } from "./models/devig";
import { generateAnalysis } from "./ai/analysis";
import {
  getAnalysisForEvent,
  replaceOpportunitiesForEvent,
  upsertAnalysis,
  upsertEventByExternalId,
} from "./store";
import type { Sport } from "./types";

export interface IngestSummary {
  enabled: { fixtures: boolean; odds: boolean };
  sportsPulled: string[];
  fixturesSeen: number;
  eventsUpserted: number;
  opportunitiesCreated: number;
  analysesGenerated: number;
  notes: string[];
}

// Map The Odds API sport_key -> our 4 UI sports. Unmapped sports are skipped.
function mapSport(key: string): Sport | null {
  if (key.startsWith("soccer_")) return "football";
  if (key.startsWith("tennis_")) return "tennis";
  if (key.startsWith("mma")) return "ufc";
  return null;
}

export async function runIngestion(): Promise<IngestSummary> {
  const summary: IngestSummary = {
    enabled: { fixtures: oddsApiEnabled, odds: oddsApiEnabled },
    sportsPulled: [],
    fixturesSeen: 0,
    eventsUpserted: 0,
    opportunitiesCreated: 0,
    analysesGenerated: 0,
    notes: [],
  };

  if (!oddsApiEnabled) {
    summary.notes.push(
      "ODDS_API_KEY not set — no live events ingested (running on seed data).",
    );
    return summary;
  }

  const maxSports = Number(process.env.ODDS_MAX_SPORTS) || 6;
  const active = await listActiveSports();
  const all = active
    .map((s) => ({ info: s, sport: mapSport(s.key) }))
    .filter((x): x is { info: (typeof active)[number]; sport: Sport } => !!x.sport);

  // Round-robin across sports so tennis/ufc/football all get coverage within the
  // quota cap, instead of one sport dominating the raw API order.
  const groups: Record<Sport, typeof all> = {
    ufc: all.filter((x) => x.sport === "ufc"),
    tennis: all.filter((x) => x.sport === "tennis"),
    football: all.filter((x) => x.sport === "football"),
    "horse-racing": [],
  };
  const order: Sport[] = ["ufc", "tennis", "football"];
  const mapped: typeof all = [];
  let added = true;
  while (mapped.length < maxSports && added) {
    added = false;
    for (const sp of order) {
      const g = groups[sp];
      if (g.length) {
        mapped.push(g.shift()!);
        added = true;
        if (mapped.length >= maxSports) break;
      }
    }
  }

  if (!mapped.length) {
    summary.notes.push(
      "No active in-season sports mapped to football/tennis/ufc right now.",
    );
    return summary;
  }

  for (const { info, sport } of mapped) {
    summary.sportsPulled.push(info.key);
    const markets = sport === "football" ? "h2h,totals" : "h2h";
    const events = await fetchEventsWithOdds(info.key, { markets });
    summary.fixturesSeen += events.length;

    for (const ev of events) {
      if (!ev.bookmakers?.length) continue;

      const { opportunities, marketConfidence } = buildDevigOpportunities(
        ev.home_team,
        ev.away_team,
        ev.bookmakers,
        { sport },
      );

      const event = await upsertEventByExternalId({
        externalId: `oa_${ev.id}`,
        sport,
        competition: ev.sport_title,
        homeName: ev.home_team,
        awayName: ev.away_team,
        startsAt: ev.commence_time,
        venue: undefined,
        marketConfidence,
        status: "scheduled",
      });
      summary.eventsUpserted += 1;

      await replaceOpportunitiesForEvent(event.id, opportunities);
      summary.opportunitiesCreated += opportunities.length;

      // Generate prose once per event (first time we see it); odds/opps refresh
      // on every run, but we don't regenerate the (costly) analysis each time.
      const existing = await getAnalysisForEvent(event.id);
      if (!existing) {
        const generated = await generateAnalysis({
          sport,
          competition: ev.sport_title,
          homeName: ev.home_team,
          awayName: ev.away_team,
          startsAt: ev.commence_time,
          facts: { bookmakers: ev.bookmakers.length, marketConfidence },
          opportunities: opportunities.map((o) => ({
            market: o.market,
            bookmakerOdds: o.bookmakerOdds,
            fairOdds: o.fairOdds,
            edgePct: o.edgePct,
          })),
        });
        await upsertAnalysis({
          id: `an_${event.id}`,
          eventId: event.id,
          premium: true,
          published: true,
          publishedAt: new Date().toISOString(),
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
