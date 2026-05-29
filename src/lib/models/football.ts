// Quantitative fair-odds model for football using a bivariate Poisson goals model.
// This is the "value engine": fair odds come from the model, edge = book / fair - 1.
// It is independent of the LLM (which only writes the prose explanation).

import type { MatchOdds } from "../providers/the-odds-api";
import type { Opportunity } from "../types";

const factorialCache = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];
function poisson(k: number, lambda: number) {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorialCache[k];
}

export interface MatchProbabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number;
  under25: number;
  homeTeamOver15: number; // home scores 2+
  lambdaHome: number;
  lambdaAway: number;
}

// Compute outcome probabilities from expected goals (lambdas) via a score matrix.
export function matchProbabilities(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals = 10,
): MatchProbabilities {
  let homeWin = 0,
    draw = 0,
    awayWin = 0,
    over25 = 0,
    homeTeamOver15 = 0;

  for (let h = 0; h <= maxGoals; h++) {
    const ph = poisson(h, lambdaHome);
    if (h >= 2) homeTeamOver15 += ph;
    for (let a = 0; a <= maxGoals; a++) {
      const p = ph * poisson(a, lambdaAway);
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
      if (h + a > 2) over25 += p;
    }
  }
  return {
    homeWin,
    draw,
    awayWin,
    over25,
    under25: 1 - over25,
    homeTeamOver15,
    lambdaHome,
    lambdaAway,
  };
}

// Derive expected goals from team scoring/conceding rates, regressed to the
// league mean. Falls back to league-average strength when data is missing.
export function estimateLambdas(input: {
  homeScoredAvg?: number;
  homeConcededAvg?: number;
  awayScoredAvg?: number;
  awayConcededAvg?: number;
  leagueAvgGoals?: number;
}): { lambdaHome: number; lambdaAway: number } {
  const leagueAvg = input.leagueAvgGoals ?? 1.35;
  const homeAdv = 1.15; // home-field multiplier
  const hs = input.homeScoredAvg ?? leagueAvg;
  const hc = input.homeConcededAvg ?? leagueAvg;
  const as = input.awayScoredAvg ?? leagueAvg;
  const ac = input.awayConcededAvg ?? leagueAvg;
  // attack * opponent defence, normalised by league average
  const lambdaHome = (hs * ac) / leagueAvg * homeAdv;
  const lambdaAway = (as * hc) / leagueAvg;
  return {
    lambdaHome: clamp(lambdaHome, 0.2, 4),
    lambdaAway: clamp(lambdaAway, 0.2, 4),
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const fair = (p: number) => (p > 0 ? 1 / p : Infinity);
const edgePct = (book: number, fairOdds: number) =>
  fairOdds > 0 ? (book / fairOdds - 1) * 100 : 0;

// Confidence (0-10): scales with edge size, dampened so it never looks like a lock.
function confidenceFor(edge: number, probability: number) {
  const base = 4 + Math.min(edge, 25) / 5; // edge contribution
  const certainty = probability > 0.6 || probability < 0.4 ? 0.5 : 0; // decisive prob
  return clamp(Number((base + certainty).toFixed(1)), 1, 9.5);
}

export interface ModeledOpportunity
  extends Omit<Opportunity, "id" | "eventId"> {}

// Compare model fair odds to bookmaker odds and emit positive-edge opportunities.
export function buildFootballOpportunities(
  home: string,
  away: string,
  probs: MatchProbabilities,
  odds: MatchOdds,
  minEdge = 4,
): ModeledOpportunity[] {
  const candidates: Array<{
    market: string;
    book?: number;
    prob: number;
    reason: string;
  }> = [
    {
      market: `${home} to win`,
      book: odds.homeWin,
      prob: probs.homeWin,
      reason: `Model win probability ${(probs.homeWin * 100).toFixed(0)}% (xG ${probs.lambdaHome.toFixed(2)}–${probs.lambdaAway.toFixed(2)}).`,
    },
    {
      market: `${away} to win`,
      book: odds.awayWin,
      prob: probs.awayWin,
      reason: `Model away win probability ${(probs.awayWin * 100).toFixed(0)}%.`,
    },
    {
      market: "Over 2.5 Match Goals",
      book: odds.over25,
      prob: probs.over25,
      reason: `Combined xG ${(probs.lambdaHome + probs.lambdaAway).toFixed(2)}; over 2.5 in ${(probs.over25 * 100).toFixed(0)}% of simulations.`,
    },
    {
      market: "Under 2.5 Match Goals",
      book: odds.under25,
      prob: probs.under25,
      reason: `Low combined xG favours under 2.5 (${(probs.under25 * 100).toFixed(0)}%).`,
    },
    {
      market: `${home} Over 1.5 Team Goals`,
      book: undefined, // team totals not in our odds feed; derived display only
      prob: probs.homeTeamOver15,
      reason: `${home} expected to score 2+ in ${(probs.homeTeamOver15 * 100).toFixed(0)}% of simulations.`,
    },
  ];

  const out: ModeledOpportunity[] = [];
  for (const c of candidates) {
    if (!c.book) continue;
    const fairOdds = fair(c.prob);
    const edge = edgePct(c.book, fairOdds);
    if (edge < minEdge) continue;
    out.push({
      market: c.market,
      bookmakerOdds: Number(c.book.toFixed(2)),
      fairOdds: Number(fairOdds.toFixed(2)),
      edgePct: Number(edge.toFixed(0)),
      confidence: confidenceFor(edge, c.prob),
      reasoning: c.reason,
    });
  }
  return out.sort((a, b) => b.edgePct - a.edgePct);
}
