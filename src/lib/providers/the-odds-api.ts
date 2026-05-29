// The Odds API provider. Docs: https://the-odds-api.com/liveapi/guides/v4/
// Set ODDS_API_KEY to enable. Returns consensus/best odds per market we model.

export const oddsApiEnabled = !!process.env.ODDS_API_KEY;

const BASE = "https://api.the-odds-api.com/v4";

export interface MatchOdds {
  // Best (max) decimal price seen across books for each outcome.
  homeWin?: number;
  draw?: number;
  awayWin?: number;
  over25?: number;
  under25?: number;
}

interface OddsApiEvent {
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: Array<{
    markets: Array<{
      key: string; // "h2h" | "totals"
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
}

// Pull odds for a sport key (e.g. "soccer_epl") and index by a normalized
// "home|away" key so the ingestion step can match them to fixtures.
export async function fetchOdds(sportKey: string): Promise<Map<string, MatchOdds>> {
  const out = new Map<string, MatchOdds>();
  if (!oddsApiEnabled) return out;

  const url = `${BASE}/sports/${sportKey}/odds?regions=uk,eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${process.env.ODDS_API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return out;
  const events = (await res.json()) as OddsApiEvent[];

  for (const ev of events) {
    const odds: MatchOdds = {};
    for (const book of ev.bookmakers ?? []) {
      for (const market of book.markets ?? []) {
        if (market.key === "h2h") {
          for (const o of market.outcomes) {
            if (o.name === ev.home_team) odds.homeWin = max(odds.homeWin, o.price);
            else if (o.name === ev.away_team) odds.awayWin = max(odds.awayWin, o.price);
            else if (o.name.toLowerCase() === "draw") odds.draw = max(odds.draw, o.price);
          }
        } else if (market.key === "totals") {
          for (const o of market.outcomes) {
            if (o.point === 2.5 && /over/i.test(o.name)) odds.over25 = max(odds.over25, o.price);
            if (o.point === 2.5 && /under/i.test(o.name)) odds.under25 = max(odds.under25, o.price);
          }
        }
      }
    }
    out.set(normalizeKey(ev.home_team, ev.away_team), odds);
  }
  return out;
}

const max = (a: number | undefined, b: number) => (a === undefined ? b : Math.max(a, b));

export function normalizeKey(home: string, away: string) {
  const n = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/fc|cf|afc/g, "");
  return `${n(home)}|${n(away)}`;
}
