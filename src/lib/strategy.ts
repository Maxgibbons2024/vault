import type { Event, MarketKind, Opportunity, Sport, Strategy } from "./types";

// Classify an opportunity's market string into a strategy market kind.
export function marketKind(market: string): MarketKind {
  return /\d(\.\d)?\s*goals/i.test(market) || /over|under/i.test(market)
    ? "totals"
    : "h2h";
}

export interface TenantSelection {
  opportunity: Opportunity;
  event: Event;
}

// Select from the GLOBAL opportunity pool the picks that match a tenant's
// strategy: sport, market kind, edge threshold, probability band — upcoming only,
// strongest first, capped at maxPicks. This is what makes each tipster distinct.
export function selectForTenant(
  strategy: Strategy,
  events: Event[],
  opportunities: Opportunity[],
): TenantSelection[] {
  const now = Date.now();
  const eventById = new Map(events.map((e) => [e.id, e]));
  const sports = new Set<Sport>(strategy.sports);
  const markets = new Set<MarketKind>(strategy.markets);

  return opportunities
    .map((opportunity) => ({ opportunity, event: eventById.get(opportunity.eventId) }))
    .filter((x): x is TenantSelection => {
      const e = x.event;
      if (!e) return false;
      if (new Date(e.startsAt).getTime() <= now) return false;
      if (!sports.has(e.sport)) return false;
      if (!markets.has(marketKind(x.opportunity.market))) return false;
      if (x.opportunity.edgePct < strategy.minEdge) return false;
      const fairProb = x.opportunity.fairOdds > 0 ? 1 / x.opportunity.fairOdds : 0;
      if (fairProb < strategy.minProb || fairProb > strategy.maxProb) return false;
      return true;
    })
    .sort((a, b) => b.opportunity.edgePct - a.opportunity.edgePct)
    .slice(0, strategy.maxPicks);
}
