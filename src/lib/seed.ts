import type {
  Analysis,
  Event,
  Opportunity,
  ResultRow,
  Subscription,
  Tenant,
  User,
} from "./types";
import { DEFAULT_BRAND, DEFAULT_STRATEGY } from "./types";

export const DEFAULT_TENANT_ID = "ten_default";

// Demo seed data. Fixtures/analyses/opportunities are intentionally EMPTY —
// real events come from the live ingestion pipeline (The Odds API). Only demo
// accounts (for login) and a small analytics sample are seeded.
const now = new Date();
const day = 24 * 60 * 60 * 1000;
const iso = (offsetDays: number, hour = 0, min = 0) => {
  const d = new Date(now.getTime() + offsetDays * day);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};
const pastIso = (offsetDays: number) =>
  new Date(now.getTime() - offsetDays * day).toISOString();

// Default tenant preserves the original VaultBets brand + strategy. Telegram
// creds come from env so the existing channel keeps working.
export const seedTenants: Tenant[] = [
  {
    id: DEFAULT_TENANT_ID,
    slug: "vaultbets",
    name: "VaultBets AI",
    status: "active",
    brand: DEFAULT_BRAND,
    strategy: DEFAULT_STRATEGY,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? null,
    telegramChannelId: process.env.TELEGRAM_CHANNEL_ID ?? null,
    customDomain: null,
    createdAt: pastIso(120),
  },
];

export const seedUsers: User[] = [
  {
    id: "u_demo",
    tenantId: DEFAULT_TENANT_ID,
    email: "demo@vaultbets.ai",
    name: "Demo User",
    password: "demo1234",
    role: "user",
    createdAt: pastIso(40),
  },
  {
    id: "u_admin",
    tenantId: null, // platform-level
    email: "admin@vaultbets.ai",
    name: "Platform Admin",
    password: "admin1234",
    role: "platform_admin",
    createdAt: pastIso(120),
  },
];

export const seedSubscriptions: Subscription[] = [
  {
    id: "sub_demo",
    userId: "u_demo",
    tenantId: DEFAULT_TENANT_ID,
    plan: "pro",
    status: "active",
    currentPeriodEnd: iso(24),
  },
];

// No placeholder fixtures — these are populated only by live ingestion.
export const seedEvents: Event[] = [];
export const seedAnalyses: Analysis[] = [];
export const seedOpportunities: Opportunity[] = [];

// Analytics starts empty; real results are written by the settlement job once
// ingested events finish.
export const seedResults: ResultRow[] = [];
