// Ingestion pipeline (Odds-API-led): upcoming events + odds -> de-vig value
// model -> AI analysis -> persist. Idempotent via externalId ("oa_<id>").
// Runs on a schedule (see /api/ingest). No team stats are required.

import {
  fetchEventsWithOdds,
  listActiveSports,
  oddsApiEnabled,
} from "./providers/the-odds-api";
import { buildDevigOpportunities } from "./models/devig";
import {
  replaceOpportunitiesForEvent,
  upsertEventByExternalId,
} from "./store";
import type { Sport } from "./types";

export interface IngestSummary {
  enabled: { fixtures: boolean; odds: boolean };
  sportsPulled: string[];
  fixturesSeen: number;
  eventsUpserted: number;
  opportunitiesCreated: number;
  notes: string[];
}

// Map The Odds API sport_key -> our 4 UI sports. Unmapped sports are skipped.
function mapSport(key: string): Sport | null {
  if (key.startsWith("soccer_")) return "football";
  if (key.startsWith("tennis_")) return "tennis";
  if (key.startsWith("mma")) return "ufc";
  return null;
}

// Marquee soccer competitions to prioritise (earlier = higher priority).
const SOCCER_PRIORITY = [
  "soccer_uefa_champs_league",
  "soccer_fifa_world_cup",
  "soccer_uefa_europa_league",
  "soccer_conmebol_copa_libertadores",
  "soccer_epl",
  "soccer_spain_la_liga",
  "soccer_italy_serie_a",
  "soccer_germany_bundesliga",
  "soccer_france_ligue_one",
  "soccer_usa_mls",
  "soccer_brazil_campeonato",
];
function soccerRank(key: string) {
  const i = SOCCER_PRIORITY.indexOf(key);
  return i === -1 ? SOCCER_PRIORITY.length + 1 : i;
}

export async function runIngestion(): Promise<IngestSummary> {
  const summary: IngestSummary = {
    enabled: { fixtures: oddsApiEnabled, odds: oddsApiEnabled },
    sportsPulled: [],
    fixturesSeen: 0,
    eventsUpserted: 0,
    opportunitiesCreated: 0,
    notes: [],
  };

  if (!oddsApiEnabled) {
    summary.notes.push(
      "ODDS_API_KEY not set — no live events ingested (running on seed data).",
    );
    return summary;
  }

  const maxSports = Number(process.env.ODDS_MAX_SPORTS) || 8;
  const maxEvents = Number(process.env.ODDS_MAX_EVENTS_PER_SPORT) || 12;
  const active = await listActiveSports();
  const all = active
    .map((s) => ({ info: s, sport: mapSport(s.key) }))
    .filter((x): x is { info: (typeof active)[number]; sport: Sport } => !!x.sport);

  // Round-robin across sports so tennis/ufc/football all get coverage within the
  // quota cap; football is ordered by marquee priority (UCL, World Cup, ...).
  const groups: Record<Sport, typeof all> = {
    ufc: all.filter((x) => x.sport === "ufc"),
    tennis: all.filter((x) => x.sport === "tennis"),
    football: all
      .filter((x) => x.sport === "football")
      .sort((a, b) => soccerRank(a.info.key) - soccerRank(b.info.key)),
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
    const events = (await fetchEventsWithOdds(info.key, { markets }))
      .filter((e) => e.bookmakers?.length)
      .sort((a, b) => +new Date(a.commence_time) - +new Date(b.commence_time))
      .slice(0, maxEvents); // soonest N per sport (bounds runtime + quota)
    summary.fixturesSeen += events.length;

    for (const ev of events) {
      const { opportunities, marketConfidence, metrics } = buildDevigOpportunities(
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
        metrics,
      });
      summary.eventsUpserted += 1;

      await replaceOpportunitiesForEvent(event.id, opportunities);
      summary.opportunitiesCreated += opportunities.length;
      // Analysis prose is generated lazily on first view (see analysis-service).
    }
  }

  return summary;
}
