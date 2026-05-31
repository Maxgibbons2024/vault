import type {
  Analysis,
  Event,
  Opportunity,
  PickStatus,
  PlanId,
  ResultRow,
  Sport,
  Subscription,
  Tenant,
  TenantPick,
  User,
} from "../types";

// The repository surface the whole app depends on. Two implementations exist:
// an in-memory store (demo / no database) and a Prisma/Postgres store (live).
// Everything is async so the backends are interchangeable.
export interface Repo {
  // tenants
  listTenants(): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(input: Omit<Tenant, "id" | "createdAt">): Promise<Tenant>;
  updateTenant(id: string, patch: Partial<Omit<Tenant, "id">>): Promise<Tenant | undefined>;

  // users (scoped by tenant where relevant)
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  listUsers(tenantId?: string): Promise<User[]>;
  createUser(input: {
    email: string;
    name: string;
    password: string;
    tenantId?: string | null;
    role?: User["role"];
  }): Promise<User>;

  // subscriptions
  getSubscriptionForUser(userId: string): Promise<Subscription | undefined>;
  listSubscriptions(tenantId?: string): Promise<Subscription[]>;
  setPlanForUser(userId: string, plan: PlanId): Promise<Subscription | undefined>;

  // tenant picks (per-tenant ledger: dedupe + telegram state + track record)
  upsertTenantPick(pick: Omit<TenantPick, "id" | "createdAt" | "status" | "roi" | "telegramSentAt" | "settledAt">): Promise<TenantPick>;
  listTenantPicks(tenantId: string, opts?: { status?: PickStatus }): Promise<TenantPick[]>;
  listUnsentTenantPicks(tenantId: string): Promise<TenantPick[]>;
  listPendingTenantPicks(): Promise<TenantPick[]>;
  markTenantPickSent(id: string): Promise<void>;
  gradeTenantPick(id: string, status: PickStatus, roi: number): Promise<void>;

  // events
  listEvents(sport?: Sport): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(input: Omit<Event, "id">): Promise<Event>;
  updateEvent(id: string, patch: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;
  upsertEventByExternalId(input: Omit<Event, "id">): Promise<Event>;

  // analyses
  getAnalysisForEvent(eventId: string): Promise<Analysis | undefined>;
  listAnalyses(): Promise<Analysis[]>;
  upsertAnalysis(analysis: Analysis): Promise<Analysis>;
  setAnalysisPublished(analysisId: string, published: boolean): Promise<Analysis | undefined>;
  deleteAnalysis(analysisId: string): Promise<void>;

  // opportunities
  listOpportunitiesForEvent(eventId: string): Promise<Opportunity[]>;
  listOpportunities(): Promise<Opportunity[]>;
  replaceOpportunitiesForEvent(
    eventId: string,
    ops: Omit<Opportunity, "id" | "eventId">[],
  ): Promise<void>;

  // results (legacy global track record; superseded per-tenant by TenantPick)
  listResults(): Promise<ResultRow[]>;
  addResult(row: Omit<ResultRow, "id">): Promise<ResultRow>;
}
