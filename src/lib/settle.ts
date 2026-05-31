// Settlement (Odds-API-led): grade each tenant's pending TenantPicks against the
// final score from The Odds API /scores, so every tipster's track record is real.

import {
  fetchScores,
  listActiveSports,
  oddsApiEnabled,
} from "./providers/the-odds-api";
import {
  gradeTenantPick,
  listEvents,
  listPendingTenantPicks,
  updateEvent,
} from "./store";
import type { PickStatus, Sport } from "./types";

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

// Decide won/lost for a market given the final score.
function grade(
  market: string,
  home: string,
  away: string,
  homeScore: number,
  awayScore: number,
): PickStatus {
  const total = homeScore + awayScore;
  const m = market.toLowerCase();
  if (m === "draw") return homeScore === awayScore ? "won" : "lost";
  if (m.includes("over 2.5")) return total > 2.5 ? "won" : "lost";
  if (m.includes("under 2.5")) return total < 2.5 ? "won" : "lost";
  if (m.endsWith("to win")) {
    const team = market.slice(0, -" to win".length).trim().toLowerCase();
    if (team === home.toLowerCase()) return homeScore > awayScore ? "won" : "lost";
    if (team === away.toLowerCase()) return awayScore > homeScore ? "won" : "lost";
  }
  return "pending";
}

export async function runSettlement(): Promise<SettleSummary> {
  const summary: SettleSummary = { enabled: oddsApiEnabled, finishedSeen: 0, graded: 0, notes: [] };
  if (!oddsApiEnabled) {
    summary.notes.push("ODDS_API_KEY not set — settlement skipped.");
    return summary;
  }

  const maxSports = Number(process.env.ODDS_MAX_SPORTS) || 8;
  const active = (await listActiveSports()).filter((s) => mapSport(s.key)).slice(0, maxSports);

  const [events, pending] = await Promise.all([listEvents(), listPendingTenantPicks()]);
  const eventById = new Map(events.map((e) => [e.id, e]));

  // Build final-score map keyed by our event externalId ("oa_<id>").
  const scoreByExternal = new Map<string, { home: string; away: string; hs: number; as: number }>();
  for (const s of active) {
    const scores = await fetchScores(s.key, 3);
    for (const sc of scores) {
      if (!sc.completed || !sc.scores) continue;
      const sm = new Map(sc.scores.map((x) => [x.name, Number(x.score)]));
      const hs = sm.get(sc.home_team);
      const as = sm.get(sc.away_team);
      if (hs == null || as == null || Number.isNaN(hs) || Number.isNaN(as)) continue;
      scoreByExternal.set(`oa_${sc.id}`, { home: sc.home_team, away: sc.away_team, hs, as });
    }
  }
  summary.finishedSeen = scoreByExternal.size;

  const finishedEventIds = new Set<string>();
  for (const pick of pending) {
    const event = eventById.get(pick.eventId);
    if (!event?.externalId) continue;
    const sc = scoreByExternal.get(event.externalId);
    if (!sc) continue;
    const status = grade(pick.market, sc.home, sc.away, sc.hs, sc.as);
    if (status === "pending") continue;
    const roi = status === "won" ? Number(((pick.bestPrice - 1) * 100).toFixed(0)) : -100;
    await gradeTenantPick(pick.id, status, roi);
    summary.graded += 1;
    finishedEventIds.add(event.id);
  }
  for (const id of finishedEventIds) await updateEvent(id, { status: "finished" });

  return summary;
}
