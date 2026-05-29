# VaultBets AI — Go-Live Guide

The app runs in **demo mode** out of the box (seed data, no external calls). It
becomes a live product as you set each group of environment variables below.
**No code changes are needed** — every integration reads its keys at runtime and
falls back gracefully when they're absent.

| Capability        | Enabled by                          | Fallback when unset            |
| ----------------- | ----------------------------------- | ------------------------------ |
| Persistence       | `DATABASE_URL` (Supabase)           | In-memory seed store           |
| Live fixtures     | `API_FOOTBALL_KEY`                  | No live events ingested        |
| Live odds         | `ODDS_API_KEY`                      | Model runs without market odds |
| AI analysis       | `ANTHROPIC_API_KEY`                 | Deterministic template prose   |
| Subscriptions     | `STRIPE_SECRET_KEY` + price IDs     | Demo plan activation (no charge)|
| Scheduled jobs    | `CRON_SECRET` + a scheduler         | Manual trigger only            |

Copy `.env.example` → `.env.local` and fill in as you go.

---

## 1. Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string**:
   - `DATABASE_URL` = the **pooled** URL (Transaction pooler, port `6543`), append
     `?pgbouncer=true&connection_limit=1`.
   - `DIRECT_URL` = the **direct** URL (port `5432`) — used for migrations.
3. Apply the schema and seed it:
   ```bash
   npm run db:push     # create tables from prisma/schema.prisma
   npm run db:seed     # load demo data (optional once live data flows)
   ```
   (For versioned migrations use `npx prisma migrate dev` locally and
   `npm run db:migrate` in CI/production instead of `db:push`.)
4. Restart the app. It now reads/writes Postgres. Inspect data with
   `npm run db:studio`.

## 2. Live fixtures — API-Football

1. Get a key at [api-football.com](https://www.api-football.com/) (free tier
   available) and set `API_FOOTBALL_KEY`.
2. Leagues pulled are configured in `src/lib/ingest.ts` (`FOOTBALL_LEAGUES`) —
   defaults: Premier League (39), LaLiga (140), Champions League (2). Add more by
   pairing each `leagueId` with its Odds API `oddsSportKey`.

## 3. Live odds — The Odds API

1. Get a key at [the-odds-api.com](https://the-odds-api.com/) and set
   `ODDS_API_KEY`.
2. The pipeline pulls `h2h` and `totals` markets, takes the best price across UK/EU
   books, and matches them to fixtures by team name.

## 4. AI analysis — Claude

1. Set `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`).
2. The static analysis rubric is sent with **prompt caching** (`cache_control`),
   so repeated generations are cheaper and faster. Per-match data is the only
   uncached part. See `src/lib/ai/analysis.ts`.

## 5. The value engine (no key needed)

`src/lib/models/football.ts` is a Poisson goals model: it turns expected goals
into outcome probabilities, derives **fair odds = 1 / probability**, and computes
**edge = bookmaker odds / fair odds − 1**. This is independent of the LLM — Claude
only writes the prose. Improve it by feeding real team scoring/conceding rates
into `estimateLambdas()` (wire richer API-Football stats endpoints into the
ingestion step).

## 6. Run the pipeline

Manually:
```bash
curl -X POST "http://localhost:3000/api/ingest?secret=$CRON_SECRET"   # fixtures→odds→model→AI→DB
curl -X POST "http://localhost:3000/api/settle?secret=$CRON_SECRET"   # grade finished events → results/ROI
# or, against the data layer directly:
npm run ingest
```

On a schedule:
- **Vercel** — `vercel.json` already defines crons (`/api/ingest` hourly,
  `/api/settle` at :30). Set `CRON_SECRET` in Vercel env; Vercel Cron sends it
  automatically as a Bearer token.
- **Supabase** — alternatively use `pg_cron` + `pg_net` to `POST` the same
  endpoints, or run `npm run ingest` from a GitHub Action on a cron.

## 7. Subscriptions — Stripe

1. Create two recurring Prices (Starter £19, Pro £49) in the Stripe dashboard.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`.
3. Add a webhook to `POST /api/stripe/webhook` for `checkout.session.completed`
   and set `STRIPE_WEBHOOK_SECRET`.
4. Set `NEXT_PUBLIC_BASE_URL` to your deployed URL.

## 8. Production hardening (recommended before launch)

- **Passwords:** the demo stores plaintext. Hash with `bcrypt`/`argon2` in
  `repo.createUser` and the login check, or adopt **Auth.js / Clerk**.
- **Sessions:** the session cookie holds the user id. Swap for a signed JWT or an
  opaque session table.
- **Rate limiting** on `/api/auth/*` and ingestion.
- **Provider quotas:** API-Football / The Odds API free tiers are limited; cache
  and widen the cron interval, or upgrade plans for production volume.

---

## Deploy checklist

- [ ] Supabase project created; `DATABASE_URL` + `DIRECT_URL` set
- [ ] `npm run db:push` (or migrate) run against it
- [ ] `API_FOOTBALL_KEY`, `ODDS_API_KEY`, `ANTHROPIC_API_KEY` set
- [ ] `CRON_SECRET` set; cron scheduled (Vercel `vercel.json` or pg_cron)
- [ ] Stripe keys + prices + webhook configured
- [ ] `NEXT_PUBLIC_BASE_URL` set to the live domain
- [ ] First `/api/ingest` run returns `eventsUpserted > 0`
- [ ] Passwords hashed / real auth in place
