import { headers } from "next/headers";
import { getTenantBySlug } from "./store";
import { selectForTenant, type TenantSelection } from "./strategy";
import { listEvents, listOpportunities } from "./store";
import type { EventWithMeta } from "./store";
import type { Sport, Tenant } from "./types";

export const DEFAULT_SLUG = "vaultbets";

// Resolve the active tenant from the proxy-set header (falls back to default).
export async function getTenant(): Promise<Tenant | null> {
  const h = await headers();
  const slug = h.get("x-tenant-slug") || DEFAULT_SLUG;
  return (await getTenantBySlug(slug)) ?? (await getTenantBySlug(DEFAULT_SLUG)) ?? null;
}

// The tenant's picks selected live from the global pool by its strategy.
export async function tenantSelections(tenant: Tenant): Promise<TenantSelection[]> {
  const [events, opportunities] = await Promise.all([listEvents(), listOpportunities()]);
  return selectForTenant(tenant.strategy, events, opportunities);
}

// Tenant-scoped match cards (one per event the tenant has a pick on).
export async function tenantEventCards(
  tenant: Tenant,
  sport?: Sport,
): Promise<EventWithMeta[]> {
  const selections = await tenantSelections(tenant);
  const byEvent = new Map<string, EventWithMeta>();
  for (const { event, opportunity } of selections) {
    if (sport && event.sport !== sport) continue;
    const existing = byEvent.get(event.id);
    if (existing) existing.opportunities += 1;
    else byEvent.set(event.id, { event, opportunities: 1, premium: true });
  }
  return [...byEvent.values()].sort(
    (a, b) => +new Date(a.event.startsAt) - +new Date(b.event.startsAt),
  );
}
