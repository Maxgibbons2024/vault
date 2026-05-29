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

// The repository surface the whole app depends on. Two implementations exist:
// an in-memory store (demo / no database) and a Prisma/Postgres store (live).
// Everything is async so the backends are interchangeable.
export interface Repo {
  // users
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  createUser(input: { email: string; name: string; password: string }): Promise<User>;

  // subscriptions
  getSubscriptionForUser(userId: string): Promise<Subscription | undefined>;
  listSubscriptions(): Promise<Subscription[]>;
  setPlanForUser(userId: string, plan: PlanId): Promise<Subscription | undefined>;

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

  // results
  listResults(): Promise<ResultRow[]>;
  addResult(row: Omit<ResultRow, "id">): Promise<ResultRow>;

  // sent alerts (Telegram dedupe)
  hasSentAlert(key: string): Promise<boolean>;
  recordSentAlert(key: string): Promise<void>;
}
