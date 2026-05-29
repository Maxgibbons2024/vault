// Settlement (Odds-API-led): grade finished events' opportunities into Result
// rows + ROI using The Odds API /scores, so the Analytics track record is real.

import {
  fetchScores,
  listActiveSports,
  oddsApiEnabled,
} from "./providers/the-odds-api";
import {
  addResult,
  listEvents,
  listOpportunitiesForEvent,
  updateEvent,
} from "./store";
import type { Opportunity, ResultStatus, Sport } from "./types";

export interface SettleSummary {
  enabled: boolean;
  finishedSeen: number;
  graded: number;
  notes: string[];
}

function mapSport(key: string): Sport | null {
  if (key.startsWith("soccer_")) return "football";
  if (key.startsWith("tennis_")) return "tennis";
  if (key.startsWith("mma")) return "ufc";
  return null;
}

// Decide win/lose for one opportunity given the final score.
function grade(
  op: Opportunity,
  home: string,
  away: string,
  homeScore: number,
  awayScore: number,
): ResultStatus {
  const total = homeScore + awayScore;
  const m = op.market.toLowerCase();
  if (m === "draw") return homeScore === awayScore ? "won" : "lost";
  if (m.includes("over 2.5")) return total > 2.5 ? "won" : "lost";
  if (m.includes("under 2.5")) return total < 2.5 ? "won" : "lost";
  if (m.endsWith("to win")) {
    const team = op.market.slice(0, -" to win".length).trim().toLowerCase();
    if (team === home.toLowerCase()) return homeScore > awayScore ? "won" : "lost";
    if (team === away.toLowerCase()) return awayScore > homeScore ? "won" : "lost";
  }
  return "pending";
}

export async function runSettlement(): Promise<SettleSummary> {
  const summary: SettleSummary = {
    enabled: oddsApiEnabled,
    finishedSeen: 0,
    graded: 0,
    notes: [],
  };
  if (!oddsApiEnabled) {
    summary.notes.push("ODDS_API_KEY not set — settlement skipped.");
    return summary;
  }

  const maxSports = Number(process.env.ODDS_MAX_SPORTS) || 6;
  const active = (await listActiveSports())
    .filter((s) => mapSport(s.key))
    .slice(0, maxSports);

  const events = await listEvents();
  const byExternal = new Map(events.map((e) => [e.externalId, e]));

  for (const s of active) {
    const scores = await fetchScores(s.key, 3);
    for (const sc of scores) {
      if (!sc.completed || !sc.scores) continue;
      const event = byExternal.get(`oa_${sc.id}`);
      if (!event || event.status === "finished") continue;

      const scoreMap = new Map(sc.scores.map((x) => [x.name, Number(x.score)]));
      const homeScore = scoreMap.get(sc.home_team) ?? scoreMap.get(event.homeName);
      const awayScore = scoreMap.get(sc.away_team) ?? scoreMap.get(event.awayName);
      if (homeScore == null || awayScore == null || Number.isNaN(homeScore) || Number.isNaN(awayScore))
        continue;

      summary.finishedSeen += 1;
      const ops = await listOpportunitiesForEvent(event.id);
      for (const op of ops) {
        const status = grade(op, sc.home_team, sc.away_team, homeScore, awayScore);
        const roi =
          status === "won"
            ? Number(((op.bookmakerOdds - 1) * 100).toFixed(0))
            : status === "lost"
              ? -100
              : 0;
        await addResult({
          date: event.startsAt,
          sport: event.sport,
          event: `${event.homeName} vs ${event.awayName}`,
          opportunity: op.market,
          marketOdds: op.bookmakerOdds,
          fairOdds: op.fairOdds,
          status,
          roi,
        });
        summary.graded += 1;
      }
      await updateEvent(event.id, { status: "finished" });
    }
  }
  return summary;
}
