# VaultBets AI

AI-powered **sports betting analysis** platform — educational analysis, statistical
insights and AI-generated value opportunities across football, tennis, UFC and
horse racing. **It does not provide gambling services or accept wagers.**

Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.
Dark, data-driven, Bloomberg-terminal-meets-Apple aesthetic.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

### Demo accounts

| Role  | Email                 | Password    |
| ----- | --------------------- | ----------- |
| User  | `demo@vaultbets.ai`   | `demo1234`  |
| Admin | `admin@vaultbets.ai`  | `admin1234` |

The admin dashboard lives at **`/admin`** (hidden — only reachable by admin role).

## Features

- **Landing page** — hero, live stat strip, features, sports coverage, pricing.
- **Auth** — cookie sessions (login / signup / logout) with route gating.
- **Dashboard** — Events Today, Analysis Published, Value Opportunities, Sports
  Covered, plus a performance snapshot.
- **Sport sections** — Football, Tennis, UFC, Horse Racing with match cards.
- **Analysis page** — match header, full AI analysis (Overview → Conclusion),
  value-opportunity cards (market, odds, fair odds, edge %, confidence, reasoning),
  with premium content locked behind a subscription.
- **Analytics** — historical recommendations with result, ROI and status.
- **Subscriptions** — Starter (£19) / Pro (£49) plans, Stripe Checkout.
- **Admin** — create/edit/publish/delete events & analysis, manage subscribers
  and plans, view revenue metrics (MRR).
- **Site-wide compliance disclaimer.**

## Architecture

```
src/
  app/
    page.tsx                 Landing
    login/ signup/           Auth pages
    (app)/                   Authenticated shell (sidebar + disclaimer)
      dashboard/ football/ tennis/ ufc/ horse-racing/
      analytics/ account/ upgrade/ analysis/[id]/
    admin/                   Hidden admin area (role-gated) + server actions
    api/auth/                login / signup / logout route handlers
    api/stripe/              checkout + webhook route handlers
  components/                UI primitives, sidebar, cards, pricing, forms
    api/ingest/              Pipeline: fixtures→odds→model→AI→DB (cron)
    api/settle/              Grade finished events → results / ROI (cron)
  lib/
    types.ts                 Domain model (Events, Analyses, Opportunities,
                             Users, Subscriptions, Results)
    store.ts                 Async repository facade (picks backend)
    repo/memory.ts           In-memory store (demo / no DB)
    repo/prisma.ts           Postgres store (Supabase)
    db.ts                    Prisma client (enabled by DATABASE_URL)
    providers/               api-football.ts, the-odds-api.ts
    models/football.ts       Poisson fair-odds / edge engine
    ai/analysis.ts           Claude analysis (prompt caching) + template fallback
    ingest.ts  settle.ts     Pipeline orchestration
    seed.ts auth.ts plans.ts stripe.ts format.ts
```

The **data layer is isolated behind `lib/store.ts`** — the rest of the app only
calls async repository functions. With `DATABASE_URL` set it uses Supabase
Postgres; otherwise the in-memory store. Live Sports/Odds APIs, the fair-odds
model and Claude analysis all plug in via env vars **without touching the UI**.

## Going live

The app runs on seed data out of the box. To bring in **live fixtures, odds,
AI analysis and a real database**, follow **[GO-LIVE.md](./GO-LIVE.md)** — it
covers Supabase, API-Football, The Odds API, Claude (with prompt caching),
Stripe, and scheduled ingestion/settlement (Vercel Cron config included).

## Stripe

Stripe is **optional**. Without keys the app runs in **demo mode**: subscribing
activates the plan instantly (no charge). To enable live Checkout, copy
`.env.example` to `.env.local` and set:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Webhook endpoint: `POST /api/stripe/webhook` (fulfils `checkout.session.completed`).

## Future-ready

The repository layer and config are structured for: live Sports APIs, Odds APIs,
AI-generated analysis, and email / Telegram alerts (surfaced as "coming soon" in
the account page), plus mobile apps.

## Compliance

> VaultBets AI provides educational analysis and research only. Nothing on this
> website constitutes financial advice, betting advice, or a recommendation to
> place a wager. Users are responsible for their own decisions.

## Notes

- The in-memory store resets on server restart (it is re-seeded each boot). Admin
  edits persist for the life of the running process.
- `npm run build` produces an optimized production build; `npm start` serves it.
- Fonts use a system stack (no external font fetch) for offline reliability.
