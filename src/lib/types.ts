// Domain model for VaultBets AI.
// Structured as plain types + a repository layer so the in-memory store can later
// be swapped for a real database (Prisma/Postgres) or external Sports/Odds APIs
// without touching the UI.

export type Sport = "football" | "tennis" | "ufc" | "horse-racing";

export const SPORTS: { id: Sport; label: string; icon: string }[] = [
  { id: "football", label: "Football", icon: "⚽" },
  { id: "tennis", label: "Tennis", icon: "🎾" },
  { id: "ufc", label: "UFC", icon: "🥊" },
  { id: "horse-racing", label: "Horse Racing", icon: "🐎" },
];

export type PlanId = "free" | "starter" | "pro";

export type Role = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // demo only — plaintext seed; never do this in production
  role: Role;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanId;
  status: "active" | "trialing" | "canceled";
  currentPeriodEnd: string;
  stripeCustomerId?: string;
}

export interface MarketOutcome {
  name: string; // raw outcome name (team / "Draw" / "Over" / "Under")
  label: string; // display label
  fairProb: number; // 0-1 no-vig consensus probability
  fairOdds: number;
  bestPrice: number; // best decimal price across books
  edgePct: number;
}

export interface EventMetrics {
  bookmakerCount: number;
  outcomes: MarketOutcome[]; // h2h outcomes (2- or 3-way)
  totals?: MarketOutcome[]; // over/under 2.5 (soccer)
}

export interface Event {
  id: string;
  externalId?: string | null; // provider id for idempotent ingestion
  metrics?: EventMetrics | null;
  sport: Sport;
  competition: string;
  homeName: string;
  awayName: string; // for non-team sports, "away" is the opponent / "Field"
  startsAt: string; // ISO
  venue?: string;
  marketConfidence: number; // 0-100
  status: "scheduled" | "live" | "finished";
}

export interface AnalysisSection {
  heading: string;
  body: string;
}

export interface Analysis {
  id: string;
  eventId: string;
  premium: boolean;
  published: boolean;
  publishedAt?: string;
  summary: string;
  sections: AnalysisSection[];
  generatedBy?: "template" | "claude";
}

export interface Opportunity {
  id: string;
  eventId: string;
  market: string;
  bookmakerOdds: number;
  fairOdds: number;
  edgePct: number; // calculated edge, %
  confidence: number; // 0-10
  reasoning: string;
}

export type ResultStatus = "won" | "lost" | "pending";

export interface ResultRow {
  id: string;
  date: string; // ISO
  sport: Sport;
  event: string;
  opportunity: string;
  marketOdds: number;
  fairOdds: number;
  status: ResultStatus;
  roi: number; // % return on 1 unit stake
}
