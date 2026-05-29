// Settlement: grade finished events' opportunities into Result rows + ROI,
// so the Analytics track record reflects real outcomes.

import { fetchFootballFixtures, apiFootballEnabled } from "./providers/api-football";
import {
  addResult,
  listEvents,
  listOpportunitiesForEvent,
  updateEvent,
} from "./store";
import type { Opportunity, ResultStatus } from "./types";

export interface SettleSummary {
  enabled: boolean;
  finishedSeen: number;
  graded: number;
  notes: string[];
}

// Decide win/lose for a single opportunity given the final score.
function grade(
  op: Opportunity,
  home: string,
  goalsHome: number,
  goalsAway: number,
): ResultStatus {
  const total = goalsHome + goalsAway;
  const m = op.market.toLowerCase();
  if (m === `${home.toLowerCase()} to win`) return goalsHome > goalsAway ? "won" : "lost";
  if (m.endsWith("to win")) return goalsAway > goalsHome ? "won" : "lost";
  if (m.includes("over 2.5")) return total > 2.5 ? "won" : "lost";
  if (m.includes("under 2.5")) return total < 2.5 ? "won" : "lost";
  if (m.includes("over 1.5 team goals"))
    return goalsHome >= 2 ? "won" : "lost"; // assumes home team total
  return "pending";
}

export async function runSettlement(): Promise<SettleSummary> {
  const summary: SettleSummary = {
    enabled: apiFootballEnabled,
    finishedSeen: 0,
    graded: 0,
    notes: [],
  };
  if (!apiFootballEnabled) {
    summary.notes.push("API_FOOTBALL_KEY not set — settlement skipped.");
    return summary;
  }

  // Pull recent finished fixtures (look back a couple of days).
  const season = Number(process.env.FOOTBALL_SEASON) || new Date().getUTCFullYear();
  const from = process.env.FOOTBALL_FROM || undefined;
  const to = process.env.FOOTBALL_TO || undefined;
  const finished = (
    await fetchFootballFixtures({ leagueIds: [39, 140, 2], season, toDays: 1, from, to })
  ).filter((f) => f.status === "finished" && f.goalsHome != null && f.goalsAway != null);
  summary.finishedSeen = finished.length;

  const events = await listEvents("football");
  const byExternal = new Map(events.map((e) => [e.externalId, e]));

  for (const fx of finished) {
    const event = byExternal.get(fx.externalId);
    if (!event || event.status === "finished") continue;

    const ops = await listOpportunitiesForEvent(event.id);
    for (const op of ops) {
      const status = grade(op, fx.homeName, fx.goalsHome!, fx.goalsAway!);
      const roi =
        status === "won" ? Number(((op.bookmakerOdds - 1) * 100).toFixed(0))
        : status === "lost" ? -100
        : 0;
      await addResult({
        date: fx.startsAt,
        sport: "football",
        event: `${fx.homeName} vs ${fx.awayName}`,
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
  return summary;
}
