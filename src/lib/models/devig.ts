// Value engine with SHARP-BOOK ANCHORING.
// For each market (h2h, or totals O/U 2.5) we estimate the "fair" (true) price by
// de-vigging the SHARPEST bookmaker available — Pinnacle, else Betfair Exchange /
// Smarkets / Matchbook (low-margin exchanges whose prices best reflect true
// probability). If no sharp book priced the market we fall back to the no-vig
// average across all books. Edge = best available price / sharp fair − 1: i.e.
// how much a soft book's price beats the sharp line. This is the professional
// line-shopping approach and needs no team stats.

import type { OddsBookmaker } from "../providers/the-odds-api";
import type { ModeledOpportunity } from "./football";
import type { EventMetrics, MarketOutcome } from "../types";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Sharpest first. The Odds API bookmaker keys.
const SHARP_BOOKS = [
  "pinnacle",
  "betfair_ex_uk",
  "betfair_ex_eu",
  "betfair_ex_au",
  "smarkets",
  "matchbook",
];
const SHARP_LABEL: Record<string, string> = {
  pinnacle: "Pinnacle",
  betfair_ex_uk: "Betfair Exchange",
  betfair_ex_eu: "Betfair Exchange",
  betfair_ex_au: "Betfair Exchange",
  smarkets: "Smarkets",
  matchbook: "Matchbook",
};

interface BookPrices {
  key: string;
  prices: Record<string, number>;
}

function pricesByMarket(
  bookmakers: OddsBookmaker[],
  marketKey: string,
  point?: number,
): BookPrices[] {
  return bookmakers
    .map((b) => {
      const m = b.markets.find((mk) => mk.key === marketKey);
      if (!m) return null;
      const prices: Record<string, number> = {};
      for (const o of m.outcomes) {
        if (point != null && o.point !== point) continue;
        prices[o.name] = o.price;
      }
      return Object.keys(prices).length ? { key: b.key, prices } : null;
    })
    .filter((x): x is BookPrices => x !== null);
}

// No-vig average across all books — best price + fallback fair probability.
function consensus(books: BookPrices[], names: string[]) {
  const agg = new Map<string, { bestPrice: number; probSum: number; books: number }>();
  for (const n of names) agg.set(n, { bestPrice: 0, probSum: 0, books: 0 });
  for (const book of books) {
    if (!names.every((n) => book.prices[n] > 1)) continue;
    const overround = names.reduce((s, n) => s + 1 / book.prices[n], 0);
    if (overround <= 0) continue;
    for (const n of names) {
      const a = agg.get(n)!;
      a.probSum += 1 / book.prices[n] / overround;
      a.books += 1;
      a.bestPrice = Math.max(a.bestPrice, book.prices[n]);
    }
  }
  return agg;
}

// De-vig the sharpest available book → fair probabilities + which book anchored.
function sharpAnchor(
  books: BookPrices[],
  names: string[],
): { probs: Record<string, number>; label: string } | null {
  for (const key of SHARP_BOOKS) {
    const b = books.find((x) => x.key === key && names.every((n) => x.prices[n] > 1));
    if (!b) continue;
    const overround = names.reduce((s, n) => s + 1 / b.prices[n], 0);
    if (overround <= 0) continue;
    const probs: Record<string, number> = {};
    for (const n of names) probs[n] = 1 / b.prices[n] / overround;
    return { probs, label: SHARP_LABEL[key] };
  }
  return null;
}

interface Resolved {
  name: string;
  fairProb: number;
  bestPrice: number;
  bookCount: number;
}

// Combine: fair prob from sharp anchor (if available) else consensus; best price
// always the max across all books.
function resolveMarket(
  books: BookPrices[],
  names: string[],
): { rows: Resolved[]; anchorLabel: string; anchored: boolean; bookCount: number } | null {
  const agg = consensus(books, names);
  const present = names.filter((n) => (agg.get(n)?.books ?? 0) > 0);
  if (!present.length) return null;
  const bookCount = agg.get(present[0])!.books;
  const sharp = sharpAnchor(books, present);
  const rows: Resolved[] = present.map((n) => {
    const a = agg.get(n)!;
    return {
      name: n,
      fairProb: sharp ? sharp.probs[n] : a.probSum / a.books,
      bestPrice: a.bestPrice,
      bookCount: a.books,
    };
  });
  return {
    rows,
    anchorLabel: sharp ? `${sharp.label}'s no-vig price` : `${bookCount}-book no-vig consensus`,
    anchored: !!sharp,
    bookCount,
  };
}

function confidenceFor(edge: number, books: number, anchored: boolean) {
  const base =
    4 + Math.min(edge, 25) / 5 + Math.min(books, 8) / 16 + (anchored ? 0.5 : 0);
  return clamp(Number(base.toFixed(1)), 1, 9.5);
}

export interface DevigResult {
  opportunities: ModeledOpportunity[];
  marketConfidence: number;
  metrics: EventMetrics;
}

export function buildDevigOpportunities(
  home: string,
  away: string,
  bookmakers: OddsBookmaker[],
  opts: { sport: string; minEdge?: number } = { sport: "football" },
): DevigResult {
  const minEdge = opts.minEdge ?? 3;
  const opportunities: ModeledOpportunity[] = [];
  const outcomes: MarketOutcome[] = [];
  const totals: MarketOutcome[] = [];
  let topProb = 0;
  let bookmakerCount = 0;

  // ----- h2h (moneyline). Soccer adds a Draw outcome. -----
  const h2hBooks = pricesByMarket(bookmakers, "h2h");
  const names = [...new Set(h2hBooks.flatMap((b) => Object.keys(b.prices)))];
  const h2h = resolveMarket(h2hBooks, names);
  if (h2h) {
    bookmakerCount = h2h.bookCount;
    for (const r of h2h.rows) {
      topProb = Math.max(topProb, r.fairProb);
      const fairOdds = r.fairProb > 0 ? 1 / r.fairProb : Infinity;
      const edge = (r.bestPrice / fairOdds - 1) * 100;
      const label = r.name.toLowerCase() === "draw" ? "Draw" : `${r.name} to win`;
      outcomes.push({
        name: r.name.toLowerCase() === "draw" ? "Draw" : r.name,
        label,
        fairProb: Number(r.fairProb.toFixed(4)),
        fairOdds: Number(fairOdds.toFixed(2)),
        bestPrice: Number(r.bestPrice.toFixed(2)),
        edgePct: Number(edge.toFixed(0)),
      });
      if (edge >= minEdge) {
        opportunities.push({
          market: label,
          bookmakerOdds: Number(r.bestPrice.toFixed(2)),
          fairOdds: Number(fairOdds.toFixed(2)),
          edgePct: Number(edge.toFixed(0)),
          confidence: confidenceFor(edge, r.bookCount, h2h.anchored),
          reasoning: `Best price ${r.bestPrice.toFixed(2)} beats ${h2h.anchorLabel} of ${fairOdds.toFixed(2)} (${(r.fairProb * 100).toFixed(0)}% fair) — a +${edge.toFixed(0)}% edge across ${r.bookCount} books.`,
        });
      }
    }
  }

  // ----- totals: Over/Under 2.5 (mainly soccer) -----
  const totalBooks = pricesByMarket(bookmakers, "totals", 2.5);
  const tot = resolveMarket(totalBooks, ["Over", "Under"]);
  if (tot) {
    for (const r of tot.rows) {
      const fairOdds = r.fairProb > 0 ? 1 / r.fairProb : Infinity;
      const edge = (r.bestPrice / fairOdds - 1) * 100;
      totals.push({
        name: r.name,
        label: `${r.name} 2.5 Goals`,
        fairProb: Number(r.fairProb.toFixed(4)),
        fairOdds: Number(fairOdds.toFixed(2)),
        bestPrice: Number(r.bestPrice.toFixed(2)),
        edgePct: Number(edge.toFixed(0)),
      });
      if (edge >= minEdge) {
        opportunities.push({
          market: `${r.name} 2.5 Goals`,
          bookmakerOdds: Number(r.bestPrice.toFixed(2)),
          fairOdds: Number(fairOdds.toFixed(2)),
          edgePct: Number(edge.toFixed(0)),
          confidence: confidenceFor(edge, r.bookCount, tot.anchored),
          reasoning: `Best price ${r.bestPrice.toFixed(2)} beats ${tot.anchorLabel} of ${fairOdds.toFixed(2)} for ${r.name.toLowerCase()} 2.5 — a +${edge.toFixed(0)}% edge.`,
        });
      }
    }
  }

  opportunities.sort((a, b) => b.edgePct - a.edgePct);
  const marketConfidence = topProb > 0 ? clamp(Math.round(topProb * 100), 30, 95) : 50;
  return {
    opportunities,
    marketConfidence,
    metrics: { bookmakerCount, outcomes, totals: totals.length ? totals : undefined },
  };
}
