import type { Analysis, Event, Opportunity, PlanId, Sport } from "./types";
import { dbEnabled } from "./db";
import { memoryRepo } from "./repo/memory";
import { prismaRepo } from "./repo/prisma";
import type { Repo } from "./repo/types";

// Single source of truth for data access. Uses Postgres (Supabase) when
// DATABASE_URL is configured, otherwise the in-memory demo store. The rest of
// the app imports only from here and never touches a backend directly.
export const repo: Repo = dbEnabled ? prismaRepo : memoryRepo;

/* ----------------------------- Users / Auth ----------------------------- */
export const getUserByEmail = (email: string) => repo.getUserByEmail(email);
export const getUserById = (id: string) => repo.getUserById(id);
export const listUsers = () => repo.listUsers();
export const createUser = (input: { email: string; name: string; password: string }) =>
  repo.createUser(input);

/* ----------------------------- Subscriptions ---------------------------- */
export const getSubscriptionForUser = (userId: string) =>
  repo.getSubscriptionForUser(userId);
export const listSubscriptions = () => repo.listSubscriptions();
export const setPlanForUser = (userId: string, plan: PlanId) =>
  repo.setPlanForUser(userId, plan);

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

/* ------------------------------ Sent alerts ----------------------------- */
export const hasSentAlert = (key: string) => repo.hasSentAlert(key);
export const recordSentAlert = (key: string) => repo.recordSentAlert(key);

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

export async function performanceStats() {
  const results = await repo.listResults();
  const settled = results.filter((r) => r.status !== "pending");
  const wins = settled.filter((r) => r.status === "won").length;
  const winRate = settled.length ? (wins / settled.length) * 100 : 0;
  const totalRoi = settled.reduce((s, r) => s + r.roi, 0);
  const avgRoi = settled.length ? totalRoi / settled.length : 0;
  return {
    settled: settled.length,
    wins,
    losses: settled.length - wins,
    winRate,
    totalRoi,
    avgRoi,
  };
}

export async function revenueStats() {
  const price: Record<PlanId, number> = { free: 0, starter: 19, pro: 49 };
  const [subs, users] = await Promise.all([
    repo.listSubscriptions(),
    repo.listUsers(),
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
