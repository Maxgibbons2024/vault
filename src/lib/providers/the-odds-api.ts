// The Odds API provider. Docs: https://the-odds-api.com/liveapi/guides/v4/
// PRIMARY source of upcoming fixtures AND odds. Set ODDS_API_KEY to enable.
// Quota (free ~500/mo): each /odds request costs `markets × regions` credits;
// /sports is free; /scores costs 1 (or 2 with daysFrom). We default regions=uk.

export const oddsApiEnabled = !!process.env.ODDS_API_KEY;

const BASE = "https://api.the-odds-api.com/v4";
const KEY = () => process.env.ODDS_API_KEY!;

export const ODDS_REGIONS = process.env.ODDS_REGIONS || "uk";

export interface SportInfo {
  key: string;
  group: string;
  title: string;
  active: boolean;
  has_outrights: boolean;
}

export interface OddsOutcome {
  name: string;
  price: number; // decimal
  point?: number;
}
export interface OddsMarket {
  key: string; // "h2h" | "totals" | ...
  outcomes: OddsOutcome[];
}
export interface OddsBookmaker {
  key: string;
  title: string;
  markets: OddsMarket[];
}
export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string; // ISO
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

export interface OddsScore {
  id: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: { name: string; score: string }[] | null;
}

// List sports the API currently has (free, no quota cost). We filter to active.
export async function listActiveSports(): Promise<SportInfo[]> {
  if (!oddsApiEnabled) return [];
  const res = await fetch(`${BASE}/sports?apiKey=${KEY()}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as SportInfo[];
  return data.filter((s) => s.active && !s.has_outrights);
}

// Upcoming + live events for a sport, each with its raw bookmakers (for de-vig).
export async function fetchEventsWithOdds(
  sportKey: string,
  opts: { regions?: string; markets?: string } = {},
): Promise<OddsEvent[]> {
  if (!oddsApiEnabled) return [];
  const regions = opts.regions ?? ODDS_REGIONS;
  const markets = opts.markets ?? "h2h";
  const url = `${BASE}/sports/${sportKey}/odds?regions=${regions}&markets=${markets}&oddsFormat=decimal&apiKey=${KEY()}`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return [];
  return (await res.json()) as OddsEvent[];
}

// Recent finished/live events with scores, for settlement.
export async function fetchScores(
  sportKey: string,
  daysFrom = 3,
): Promise<OddsScore[]> {
  if (!oddsApiEnabled) return [];
  const url = `${BASE}/sports/${sportKey}/scores?daysFrom=${daysFrom}&apiKey=${KEY()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as OddsScore[];
}

// Legacy shape consumed by the Poisson football model (models/football.ts),
// kept for future paid-stats enrichment. Best decimal price per outcome.
export interface MatchOdds {
  homeWin?: number;
  draw?: number;
  awayWin?: number;
  over25?: number;
  under25?: number;
}

export function normalizeKey(home: string, away: string) {
  const n = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/fc|cf|afc/g, "");
  return `${n(home)}|${n(away)}`;
}
