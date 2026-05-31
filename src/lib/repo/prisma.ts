import type { Repo } from "./types";
import type {
  Analysis,
  AnalysisSection,
  Brand,
  Event,
  Opportunity,
  PickStatus,
  PlanId,
  ResultRow,
  ResultStatus,
  Sport,
  Strategy,
  Subscription,
  Tenant,
  TenantPick,
  User,
} from "../types";
import { prisma } from "../db";

// Prisma/Postgres implementation (Supabase). Maps DB rows to the app's domain
// types (Date -> ISO string, Json -> typed objects).
const db = prisma!;

/* eslint-disable @typescript-eslint/no-explicit-any */
const toTenant = (r: any): Tenant => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  status: r.status as Tenant["status"],
  brand: r.brand as Brand,
  strategy: r.strategy as Strategy,
  telegramBotToken: r.telegramBotToken ?? null,
  telegramChannelId: r.telegramChannelId ?? null,
  customDomain: r.customDomain ?? null,
  createdAt: r.createdAt.toISOString(),
});

const toTenantPick = (r: any): TenantPick => ({
  id: r.id,
  tenantId: r.tenantId,
  eventId: r.eventId,
  market: r.market,
  bestPrice: r.bestPrice,
  fairOdds: r.fairOdds,
  edgePct: r.edgePct,
  confidence: r.confidence,
  reasoning: r.reasoning,
  status: r.status as PickStatus,
  roi: r.roi,
  createdAt: r.createdAt.toISOString(),
  telegramSentAt: r.telegramSentAt ? r.telegramSentAt.toISOString() : null,
  settledAt: r.settledAt ? r.settledAt.toISOString() : null,
});

const toUser = (r: any): User => ({
  id: r.id,
  tenantId: r.tenantId ?? null,
  email: r.email,
  name: r.name,
  password: r.password,
  role: r.role as User["role"],
  createdAt: r.createdAt.toISOString(),
});

const toSub = (r: any): Subscription => ({
  id: r.id,
  userId: r.userId,
  tenantId: r.tenantId ?? null,
  plan: r.plan as PlanId,
  status: r.status as Subscription["status"],
  currentPeriodEnd: r.currentPeriodEnd.toISOString(),
  stripeCustomerId: r.stripeCustomerId ?? undefined,
});

const toEvent = (r: any): Event => ({
  id: r.id,
  externalId: r.externalId ?? undefined,
  metrics: (r.metrics as Event["metrics"]) ?? null,
  sport: r.sport as Sport,
  competition: r.competition,
  homeName: r.homeName,
  awayName: r.awayName,
  startsAt: r.startsAt.toISOString(),
  venue: r.venue ?? undefined,
  marketConfidence: r.marketConfidence,
  status: r.status as Event["status"],
});

const toAnalysis = (r: any): Analysis => ({
  id: r.id,
  eventId: r.eventId,
  premium: r.premium,
  published: r.published,
  publishedAt: r.publishedAt ? r.publishedAt.toISOString() : undefined,
  summary: r.summary,
  sections: (r.sections as AnalysisSection[]) ?? [],
  generatedBy: r.generatedBy as Analysis["generatedBy"],
});

const toOpportunity = (r: any): Opportunity => ({
  id: r.id,
  eventId: r.eventId,
  market: r.market,
  bookmakerOdds: r.bookmakerOdds,
  fairOdds: r.fairOdds,
  edgePct: r.edgePct,
  confidence: r.confidence,
  reasoning: r.reasoning,
});

const toResult = (r: any): ResultRow => ({
  id: r.id,
  date: r.date.toISOString(),
  sport: r.sport as Sport,
  event: r.event,
  opportunity: r.opportunity,
  marketOdds: r.marketOdds,
  fairOdds: r.fairOdds,
  status: r.status as ResultStatus,
  roi: r.roi,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export const prismaRepo: Repo = {
  async listTenants() {
    return (await db.tenant.findMany({ orderBy: { createdAt: "asc" } })).map(toTenant);
  },
  async getTenant(id) {
    const r = await db.tenant.findUnique({ where: { id } });
    return r ? toTenant(r) : undefined;
  },
  async getTenantBySlug(slug) {
    const r = await db.tenant.findUnique({ where: { slug } });
    return r ? toTenant(r) : undefined;
  },
  async createTenant(input) {
    const r = await db.tenant.create({
      data: {
        slug: input.slug,
        name: input.name,
        status: input.status,
        brand: input.brand as any,
        strategy: input.strategy as any,
        telegramBotToken: input.telegramBotToken ?? null,
        telegramChannelId: input.telegramChannelId ?? null,
        customDomain: input.customDomain ?? null,
      },
    });
    return toTenant(r);
  },
  async updateTenant(id, patch) {
    const r = await db.tenant.update({
      where: { id },
      data: {
        slug: patch.slug,
        name: patch.name,
        status: patch.status,
        brand: patch.brand as any,
        strategy: patch.strategy as any,
        telegramBotToken: patch.telegramBotToken,
        telegramChannelId: patch.telegramChannelId,
        customDomain: patch.customDomain,
      },
    });
    return toTenant(r);
  },

  async getUserByEmail(email) {
    const r = await db.user.findUnique({ where: { email } });
    return r ? toUser(r) : undefined;
  },
  async getUserById(id) {
    const r = await db.user.findUnique({ where: { id } });
    return r ? toUser(r) : undefined;
  },
  async listUsers(tenantId) {
    return (
      await db.user.findMany({
        where: tenantId ? { tenantId } : undefined,
        orderBy: { createdAt: "desc" },
      })
    ).map(toUser);
  },
  async createUser(input) {
    const r = await db.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: input.password,
        role: input.role ?? "user",
        tenantId: input.tenantId ?? null,
        subscription: {
          create: {
            tenantId: input.tenantId ?? null,
            plan: "free",
            status: "trialing",
            currentPeriodEnd: new Date(Date.now() + 14 * 864e5),
          },
        },
      },
    });
    return toUser(r);
  },

  async getSubscriptionForUser(userId) {
    const r = await db.subscription.findUnique({ where: { userId } });
    return r ? toSub(r) : undefined;
  },
  async listSubscriptions(tenantId) {
    return (
      await db.subscription.findMany({ where: tenantId ? { tenantId } : undefined })
    ).map(toSub);
  },
  async setPlanForUser(userId, plan: PlanId) {
    const r = await db.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 864e5),
      },
      create: {
        userId,
        plan,
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 864e5),
      },
    });
    return toSub(r);
  },

  async listEvents(sport?: Sport) {
    const r = await db.event.findMany({
      where: sport ? { sport } : undefined,
      orderBy: { startsAt: "asc" },
    });
    return r.map(toEvent);
  },
  async getEvent(id) {
    const r = await db.event.findUnique({ where: { id } });
    return r ? toEvent(r) : undefined;
  },
  async createEvent(input) {
    const r = await db.event.create({ data: eventData(input) });
    return toEvent(r);
  },
  async updateEvent(id, patch) {
    const r = await db.event.update({
      where: { id },
      data: {
        ...patch,
        startsAt: patch.startsAt ? new Date(patch.startsAt) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metrics: patch.metrics === undefined ? undefined : (patch.metrics as any),
      },
    });
    return toEvent(r);
  },
  async deleteEvent(id) {
    await db.event.delete({ where: { id } });
  },
  async upsertEventByExternalId(input) {
    if (!input.externalId) {
      const r = await db.event.create({ data: eventData(input) });
      return toEvent(r);
    }
    const r = await db.event.upsert({
      where: { externalId: input.externalId },
      update: eventData(input),
      create: eventData(input),
    });
    return toEvent(r);
  },

  async getAnalysisForEvent(eventId) {
    const r = await db.analysis.findUnique({ where: { eventId } });
    return r ? toAnalysis(r) : undefined;
  },
  async listAnalyses() {
    return (await db.analysis.findMany()).map(toAnalysis);
  },
  async upsertAnalysis(analysis: Analysis) {
    const data = {
      eventId: analysis.eventId,
      premium: analysis.premium,
      published: analysis.published,
      publishedAt: analysis.publishedAt ? new Date(analysis.publishedAt) : null,
      summary: analysis.summary,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sections: analysis.sections as any,
      generatedBy: analysis.generatedBy ?? "template",
    };
    const r = await db.analysis.upsert({
      where: { eventId: analysis.eventId },
      update: data,
      create: data,
    });
    return toAnalysis(r);
  },
  async setAnalysisPublished(analysisId, published) {
    const r = await db.analysis.update({
      where: { id: analysisId },
      data: { published, publishedAt: published ? new Date() : null },
    });
    return toAnalysis(r);
  },
  async deleteAnalysis(analysisId) {
    await db.analysis.delete({ where: { id: analysisId } });
  },

  async listOpportunitiesForEvent(eventId) {
    return (await db.opportunity.findMany({ where: { eventId } })).map(toOpportunity);
  },
  async listOpportunities() {
    return (await db.opportunity.findMany()).map(toOpportunity);
  },
  async replaceOpportunitiesForEvent(eventId, ops) {
    await db.$transaction([
      db.opportunity.deleteMany({ where: { eventId } }),
      db.opportunity.createMany({
        data: ops.map((o) => ({ ...o, eventId })),
      }),
    ]);
  },

  async listResults() {
    return (await db.result.findMany({ orderBy: { date: "desc" } })).map(toResult);
  },
  async addResult(row) {
    const r = await db.result.create({
      data: { ...row, date: new Date(row.date) },
    });
    return toResult(r);
  },

  async upsertTenantPick(pick) {
    const where = {
      tenantId_eventId_market: {
        tenantId: pick.tenantId,
        eventId: pick.eventId,
        market: pick.market,
      },
    };
    const r = await db.tenantPick.upsert({
      where,
      update: {
        bestPrice: pick.bestPrice,
        fairOdds: pick.fairOdds,
        edgePct: pick.edgePct,
        confidence: pick.confidence,
        reasoning: pick.reasoning,
      },
      create: {
        tenantId: pick.tenantId,
        eventId: pick.eventId,
        market: pick.market,
        bestPrice: pick.bestPrice,
        fairOdds: pick.fairOdds,
        edgePct: pick.edgePct,
        confidence: pick.confidence,
        reasoning: pick.reasoning,
      },
    });
    return toTenantPick(r);
  },
  async listTenantPicks(tenantId, opts) {
    return (
      await db.tenantPick.findMany({
        where: { tenantId, ...(opts?.status ? { status: opts.status } : {}) },
        orderBy: { createdAt: "desc" },
      })
    ).map(toTenantPick);
  },
  async listUnsentTenantPicks(tenantId) {
    return (
      await db.tenantPick.findMany({ where: { tenantId, telegramSentAt: null } })
    ).map(toTenantPick);
  },
  async listPendingTenantPicks() {
    return (await db.tenantPick.findMany({ where: { status: "pending" } })).map(toTenantPick);
  },
  async markTenantPickSent(id) {
    await db.tenantPick.update({ where: { id }, data: { telegramSentAt: new Date() } });
  },
  async gradeTenantPick(id, status, roi) {
    await db.tenantPick.update({
      where: { id },
      data: { status, roi, settledAt: new Date() },
    });
  },
};

function eventData(input: Omit<Event, "id">) {
  return {
    externalId: input.externalId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metrics: (input.metrics ?? undefined) as any,
    sport: input.sport,
    competition: input.competition,
    homeName: input.homeName,
    awayName: input.awayName,
    startsAt: new Date(input.startsAt),
    venue: input.venue ?? null,
    marketConfidence: input.marketConfidence,
    status: input.status,
  };
}
