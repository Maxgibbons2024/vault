import type { Analysis, Event, Opportunity, PlanId, Sport } from "./types";
import { dbEnabled } from "./db";
import { memoryRepo } from "./repo/memory";
import { prismaRepo } from "./repo/prisma";
import type { Repo } from "./repo/types";

// Single source of truth for data access. Uses Postgres (Supabase) when
// DATABASE_URL is configured, otherwise the in-memory demo store. The rest of
// the app imports only from here and never touches a backend directly.
export const repo: Repo = dbEnabled ? prismaRepo : memoryRepo;

/* -------------------------------- Tenants ------------------------------- */
export const listTenants = () => repo.listTenants();
export const getTenant = (id: string) => repo.getTenant(id);
export const getTenantBySlug = (slug: string) => repo.getTenantBySlug(slug);
export const createTenant: Repo["createTenant"] = (input) => repo.createTenant(input);
export const updateTenant: Repo["updateTenant"] = (id, patch) =>
  repo.updateTenant(id, patch);

/* ----------------------------- Users / Auth ----------------------------- */
export const getUserByEmail = (email: string) => repo.getUserByEmail(email);
export const getUserById = (id: string) => repo.getUserById(id);
export const listUsers = (tenantId?: string) => repo.listUsers(tenantId);
export const createUser: Repo["createUser"] = (input) => repo.createUser(input);

/* ----------------------------- Subscriptions ---------------------------- */
export const getSubscriptionForUser = (userId: string) =>
  repo.getSubscriptionForUser(userId);
export const listSubscriptions = (tenantId?: string) => repo.listSubscriptions(tenantId);
export const setPlanForUser = (userId: string, plan: PlanId) =>
  repo.setPlanForUser(userId, plan);

/* ----------------------------- Tenant picks ----------------------------- */
export const upsertTenantPick: Repo["upsertTenantPick"] = (p) => repo.upsertTenantPick(p);
export const listTenantPicks: Repo["listTenantPicks"] = (t, o) => repo.listTenantPicks(t, o);
export const listUnsentTenantPicks = (tenantId: string) => repo.listUnsentTenantPicks(tenantId);
export const listPendingTenantPicks = () => repo.listPendingTenantPicks();
export const markTenantPickSent = (id: string) => repo.markTenantPickSent(id);
export const gradeTenantPick: Repo["gradeTenantPick"] = (id, s, roi) =>
  repo.gradeTenantPick(id, s, roi);

export async function hasPremiumAccess(userId?: string) {
  if (!userId) return false;
  const sub = await repo.getSubscriptionForUser(userId);
  return !!sub && sub.plan !== "free" && sub.status !== "canceled";
}

/* -------------------------------- Events -------------------------------- */
export const listEvents = (sport?: Parameters<Repo["listEvents"]>[0]) =>
  repo.listEvents(sport);
export const getEvent = (id: string) => repo.getEvent(id);
export const createEvent: Repo["createEvent"] = (input) => repo.createEvent(input);
export const updateEvent: Repo["updateEvent"] = (id, patch) =>
  repo.updateEvent(id, patch);
export const deleteEvent = (id: string) => repo.deleteEvent(id);
export const upsertEventByExternalId: Repo["upsertEventByExternalId"] = (input) =>
  repo.upsertEventByExternalId(input);

/* ------------------------------- Analyses ------------------------------- */
export const getAnalysisForEvent = (eventId: string) =>
  repo.getAnalysisForEvent(eventId);
export const listAnalyses = () => repo.listAnalyses();
export const upsertAnalysis: Repo["upsertAnalysis"] = (a) => repo.upsertAnalysis(a);
export const setAnalysisPublished = (id: string, published: boolean) =>
  repo.setAnalysisPublished(id, published);
export const deleteAnalysis = (id: string) => repo.deleteAnalysis(id);

/* ----------------------------- Opportunities ---------------------------- */
export const listOpportunitiesForEvent = (eventId: string) =>
  repo.listOpportunitiesForEvent(eventId);
export const listOpportunities = () => repo.listOpportunities();
export const replaceOpportunitiesForEvent: Repo["replaceOpportunitiesForEvent"] = (
  eventId,
  ops,
) => repo.replaceOpportunitiesForEvent(eventId, ops);

/* -------------------------------- Results ------------------------------- */
export const listResults = () => repo.listResults();
export const addResult: Repo["addResult"] = (row) => repo.addResult(row);

/* --------------------------- Composed reads ----------------------------- */
export interface EventWithMeta {
  event: Event;
  opportunities: number;
  premium: boolean;
  analysis?: Analysis;
}

// Builds the data a match card needs in one pass, avoiding per-item awaits in JSX.
export async function listEventsWithMeta(sport?: Sport): Promise<EventWithMeta[]> {
  const [events, analyses, opportunities] = await Promise.all([
    repo.listEvents(sport),
    repo.listAnalyses(),
    repo.listOpportunities(),
  ]);
  const oppByEvent = new Map<string, Opportunity[]>();
  for (const o of opportunities) {
    const arr = oppByEvent.get(o.eventId) ?? [];
    arr.push(o);
    oppByEvent.set(o.eventId, arr);
  }
  const analysisByEvent = new Map(analyses.map((a) => [a.eventId, a]));
  return events.map((event) => {
    const analysis = analysisByEvent.get(event.id);
    return {
      event,
      opportunities: oppByEvent.get(event.id)?.length ?? 0,
      premium: analysis?.premium ?? false,
      analysis,
    };
  });
}

/* ------------------------------ Aggregates ------------------------------ */
export async function dashboardStats() {
  const [events, opportunities] = await Promise.all([
    repo.listEvents(),
    repo.listOpportunities(),
  ]);
  const today = new Date().toDateString();
  const eventsToday = events.filter(
    (e) => new Date(e.startsAt).toDateString() === today,
  ).length;
  // Every event has an analysis available (generated on first view).
  const analysisPublished = events.length;
  const valueOpportunities = opportunities.length;
  const sportsCovered = new Set(events.map((e) => e.sport)).size;
  return { eventsToday, analysisPublished, valueOpportunities, sportsCovered };
}

// Track record from settled picks. Tenant-scoped via TenantPick when a tenantId
// is given; otherwise falls back to the legacy global Result table.
export async function performanceStats(tenantId?: string) {
  const settledRows = tenantId
    ? (await repo.listTenantPicks(tenantId)).filter((p) => p.status === "won" || p.status === "lost")
    : (await repo.listResults()).filter((r) => r.status !== "pending");
  const wins = settledRows.filter((r) => r.status === "won").length;
  const settled = settledRows.length;
  const winRate = settled ? (wins / settled) * 100 : 0;
  const totalRoi = settledRows.reduce((s, r) => s + r.roi, 0);
  const avgRoi = settled ? totalRoi / settled : 0;
  return { settled, wins, losses: settled - wins, winRate, totalRoi, avgRoi };
}

export async function revenueStats(tenantId?: string) {
  const price: Record<PlanId, number> = { free: 0, starter: 19, pro: 49 };
  const [subs, users] = await Promise.all([
    repo.listSubscriptions(tenantId),
    repo.listUsers(tenantId),
  ]);
  const active = subs.filter((s) => s.status !== "canceled");
  const mrr = active.reduce((sum, s) => sum + price[s.plan], 0);
  const paying = active.filter((s) => s.plan !== "free").length;
  return {
    mrr,
    paying,
    totalUsers: users.length,
    starter: active.filter((s) => s.plan === "starter").length,
    pro: active.filter((s) => s.plan === "pro").length,
  };
}
