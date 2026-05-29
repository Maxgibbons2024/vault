// Generic "de-vig" value engine. Works for any sport with >=2 bookmakers.
// Method: for each set of mutually-exclusive outcomes (h2h, or totals O/U 2.5),
// strip each bookmaker's margin (normalise implied probabilities to sum to 1),
// average across books to get a no-vig CONSENSUS fair probability, then compare
// the BEST available price to that fair price. edge = bestPrice / fairOdds - 1.
// This is the standard line-shopping value approach and needs no team stats.

import type { OddsBookmaker } from "../providers/the-odds-api";
import type { ModeledOpportunity } from "./football";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface OutcomeAgg {
  name: string;
  bestPrice: number;
  probSum: number; // sum of per-book normalised probabilities
  books: number;
}

// De-vig a single market (list of mutually-exclusive outcome names) across books.
function devigMarket(
  books: { prices: Record<string, number> }[],
  outcomeNames: string[],
): Map<string, { fairProb: number; bestPrice: number; books: number }> {
  const agg = new Map<string, OutcomeAgg>();
  for (const name of outcomeNames) {
    agg.set(name, { name, bestPrice: 0, probSum: 0, books: 0 });
  }
  for (const book of books) {
    // Only use books that priced every outcome (so the de-vig is valid).
    if (!outcomeNames.every((n) => book.prices[n] > 1)) continue;
    const overround = outcomeNames.reduce((s, n) => s + 1 / book.prices[n], 0);
    if (overround <= 0) continue;
    for (const n of outcomeNames) {
      const a = agg.get(n)!;
      a.probSum += 1 / book.prices[n] / overround; // normalised (no-vig)
      a.books += 1;
      a.bestPrice = Math.max(a.bestPrice, book.prices[n]);
    }
  }
  const out = new Map<string, { fairProb: number; bestPrice: number; books: number }>();
  for (const [name, a] of agg) {
    if (a.books === 0) continue;
    out.set(name, { fairProb: a.probSum / a.books, bestPrice: a.bestPrice, books: a.books });
  }
  return out;
}

function pricesByMarket(bookmakers: OddsBookmaker[], marketKey: string, point?: number) {
  return bookmakers
    .map((b) => {
      const m = b.markets.find((mk) => mk.key === marketKey);
      if (!m) return null;
      const prices: Record<string, number> = {};
      for (const o of m.outcomes) {
        if (point != null && o.point !== point) continue;
        prices[o.name] = o.price;
      }
      return Object.keys(prices).length ? { prices } : null;
    })
    .filter((x): x is { prices: Record<string, number> } => x !== null);
}

function confidenceFor(edge: number, books: number) {
  const base = 4 + Math.min(edge, 25) / 5 + Math.min(books, 8) / 16;
  return clamp(Number(base.toFixed(1)), 1, 9.5);
}

export interface DevigResult {
  opportunities: ModeledOpportunity[];
  marketConfidence: number; // 0-100, from the favourite's consensus probability
}

export function buildDevigOpportunities(
  home: string,
  away: string,
  bookmakers: OddsBookmaker[],
  opts: { sport: string; minEdge?: number } = { sport: "football" },
): DevigResult {
  const minEdge = opts.minEdge ?? 3;
  const opportunities: ModeledOpportunity[] = [];
  let topProb = 0;

  // ----- h2h (moneyline). Soccer adds a Draw outcome. -----
  const h2hBooks = pricesByMarket(bookmakers, "h2h");
  if (h2hBooks.length) {
    // Outcome names are exactly the team names (+ "Draw") as returned by the API.
    const names = new Set<string>();
    for (const b of h2hBooks) Object.keys(b.prices).forEach((n) => names.add(n));
    const devig = devigMarket(h2hBooks, [...names]);
    for (const [name, d] of devig) {
      topProb = Math.max(topProb, d.fairProb);
      const fairOdds = d.fairProb > 0 ? 1 / d.fairProb : Infinity;
      const edge = (d.bestPrice / fairOdds - 1) * 100;
      if (edge < minEdge) continue;
      const label =
        name.toLowerCase() === "draw" ? "Draw" : `${name} to win`;
      opportunities.push({
        market: label,
        bookmakerOdds: Number(d.bestPrice.toFixed(2)),
        fairOdds: Number(fairOdds.toFixed(2)),
        edgePct: Number(edge.toFixed(0)),
        confidence: confidenceFor(edge, d.books),
        reasoning: `Best price ${d.bestPrice.toFixed(2)} vs no-vig consensus ${fairOdds.toFixed(2)} (${(d.fairProb * 100).toFixed(0)}% fair) across ${d.books} bookmakers.`,
      });
    }
  }

  // ----- totals: Over/Under 2.5 (mainly soccer) -----
  const totalBooks = pricesByMarket(bookmakers, "totals", 2.5);
  if (totalBooks.length) {
    const devig = devigMarket(totalBooks, ["Over", "Under"]);
    for (const [name, d] of devig) {
      const fairOdds = d.fairProb > 0 ? 1 / d.fairProb : Infinity;
      const edge = (d.bestPrice / fairOdds - 1) * 100;
      if (edge < minEdge) continue;
      opportunities.push({
        market: `${name} 2.5 Goals`,
        bookmakerOdds: Number(d.bestPrice.toFixed(2)),
        fairOdds: Number(fairOdds.toFixed(2)),
        edgePct: Number(edge.toFixed(0)),
        confidence: confidenceFor(edge, d.books),
        reasoning: `Best price ${d.bestPrice.toFixed(2)} vs no-vig consensus ${fairOdds.toFixed(2)} for ${name.toLowerCase()} 2.5 across ${d.books} bookmakers.`,
      });
    }
  }

  opportunities.sort((a, b) => b.edgePct - a.edgePct);
  const marketConfidence = topProb > 0 ? clamp(Math.round(topProb * 100), 30, 95) : 50;
  return { opportunities, marketConfidence };
}
