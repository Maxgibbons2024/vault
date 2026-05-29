import type { Repo } from "./types";
import type {
  Analysis,
  Event,
  Opportunity,
  PlanId,
  ResultRow,
  Sport,
  Subscription,
  User,
} from "../types";
import {
  seedAnalyses,
  seedEvents,
  seedOpportunities,
  seedResults,
  seedSubscriptions,
  seedUsers,
} from "../seed";

// In-memory implementation. Persisted on globalThis so it survives HMR in dev.
interface DB {
  users: User[];
  subscriptions: Subscription[];
  events: Event[];
  analyses: Analysis[];
  opportunities: Opportunity[];
  results: ResultRow[];
}

const g = globalThis as unknown as { __vaultbetsDB?: DB };

function freshDB(): DB {
  return {
    users: structuredClone(seedUsers),
    subscriptions: structuredClone(seedSubscriptions),
    events: structuredClone(seedEvents),
    analyses: structuredClone(seedAnalyses),
    opportunities: structuredClone(seedOpportunities),
    results: structuredClone(seedResults),
  };
}

const db: DB = (g.__vaultbetsDB ??= freshDB());

const rid = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export const memoryRepo: Repo = {
  async getUserByEmail(email) {
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  async getUserById(id) {
    return db.users.find((u) => u.id === id);
  },
  async listUsers() {
    return [...db.users];
  },
  async createUser(input) {
    const user: User = {
      id: rid("u"),
      email: input.email,
      name: input.name,
      password: input.password,
      role: "user",
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.subscriptions.push({
      id: rid("sub"),
      userId: user.id,
      plan: "free",
      status: "trialing",
      currentPeriodEnd: new Date(Date.now() + 14 * 864e5).toISOString(),
    });
    return user;
  },

  async getSubscriptionForUser(userId) {
    return db.subscriptions.find((s) => s.userId === userId);
  },
  async listSubscriptions() {
    return [...db.subscriptions];
  },
  async setPlanForUser(userId, plan: PlanId) {
    const sub = db.subscriptions.find((s) => s.userId === userId);
    if (sub) {
      sub.plan = plan;
      sub.status = "active";
      sub.currentPeriodEnd = new Date(Date.now() + 30 * 864e5).toISOString();
    }
    return sub;
  },

  async listEvents(sport?: Sport) {
    const events = sport ? db.events.filter((e) => e.sport === sport) : db.events;
    return [...events].sort(
      (a, b) => +new Date(a.startsAt) - +new Date(b.startsAt),
    );
  },
  async getEvent(id) {
    return db.events.find((e) => e.id === id);
  },
  async createEvent(input) {
    const event: Event = { ...input, id: rid("ev") };
    db.events.push(event);
    return event;
  },
  async updateEvent(id, patch) {
    const e = db.events.find((x) => x.id === id);
    if (e) Object.assign(e, patch);
    return e;
  },
  async deleteEvent(id) {
    db.events = db.events.filter((e) => e.id !== id);
    db.analyses = db.analyses.filter((a) => a.eventId !== id);
    db.opportunities = db.opportunities.filter((o) => o.eventId !== id);
  },
  async upsertEventByExternalId(input) {
    const existing = input.externalId
      ? db.events.find((e) => e.externalId === input.externalId)
      : undefined;
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }
    const event: Event = { ...input, id: rid("ev") };
    db.events.push(event);
    return event;
  },

  async getAnalysisForEvent(eventId) {
    return db.analyses.find((a) => a.eventId === eventId);
  },
  async listAnalyses() {
    return [...db.analyses];
  },
  async upsertAnalysis(analysis: Analysis) {
    const idx = db.analyses.findIndex((a) => a.id === analysis.id);
    if (idx >= 0) db.analyses[idx] = analysis;
    else db.analyses.push(analysis);
    return analysis;
  },
  async setAnalysisPublished(analysisId, published) {
    const a = db.analyses.find((x) => x.id === analysisId);
    if (a) {
      a.published = published;
      a.publishedAt = published ? new Date().toISOString() : undefined;
    }
    return a;
  },
  async deleteAnalysis(analysisId) {
    db.analyses = db.analyses.filter((a) => a.id !== analysisId);
  },

  async listOpportunitiesForEvent(eventId) {
    return db.opportunities.filter((o) => o.eventId === eventId);
  },
  async listOpportunities() {
    return [...db.opportunities];
  },
  async replaceOpportunitiesForEvent(eventId, ops) {
    db.opportunities = db.opportunities.filter((o) => o.eventId !== eventId);
    for (const op of ops) {
      db.opportunities.push({ ...op, id: rid("op"), eventId } as Opportunity);
    }
  },

  async listResults() {
    return [...db.results].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  },
  async addResult(row) {
    const result: ResultRow = { ...row, id: rid("r") };
    db.results.push(result);
    return result;
  },
};
