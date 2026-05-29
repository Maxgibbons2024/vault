# VaultBets AI — Go-Live Guide

The app runs in **demo mode** out of the box (seed data, no external calls). It
becomes a live product as you set each group of environment variables below.
**No code changes are needed** — every integration reads its keys at runtime and
falls back gracefully when they're absent.

| Capability        | Enabled by                          | Fallback when unset            |
| ----------------- | ----------------------------------- | ------------------------------ |
| Persistence       | `DATABASE_URL` (Supabase)           | In-memory seed store           |
| Live fixtures+odds | `ODDS_API_KEY` (The Odds API)      | No live events ingested        |
| AI analysis       | `ANTHROPIC_API_KEY`                 | Deterministic template prose   |
| Telegram alerts   | `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHANNEL_ID` | No posts sent        |
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

## 2. Live fixtures + odds — The Odds API (primary source)

1. Get a free key at [the-odds-api.com](https://the-odds-api.com/) (~500 req/mo)
   and set `ODDS_API_KEY`. Optionally `ODDS_REGIONS` (default `uk`) and
   `ODDS_MAX_SPORTS` (default `6`).
2. Ingestion (`src/lib/ingest.ts`) calls `/sports` for **active** competitions,
   keeps those mapping to our UI sports (`soccer_*`→football, `tennis_*`→tennis,
   `mma*`→ufc), pulls upcoming events **with odds**, and persists them. It
   auto-adapts to whatever is in season — no league lists to maintain.
3. **Quota:** each odds request costs `markets × regions` credits. Defaults keep
   it small (1 region; `h2h` for most sports, `h2h,totals` for soccer). The cron
   runs **daily** to stay within the free tier.
4. Horse racing has no free source on The Odds API, so that tab stays on seed
   data. (API-Football is optional/legacy — its free plan only covers seasons
   2022–2024, so it cannot serve upcoming fixtures; keep it only for future paid
   stats enrichment.)

## 2b. Telegram channel alerts

Posts each new value opportunity (edge ≥ `TELEGRAM_MIN_EDGE`, default 5%) to a
Telegram channel, folded into the daily ingest run. Idempotent (a `SentAlert`
table prevents reposting).

1. In Telegram, message **@BotFather** → `/newbot` → copy the token → `TELEGRAM_BOT_TOKEN`.
2. Create a channel → add the bot as an **Administrator** with "Post messages".
3. `TELEGRAM_CHANNEL_ID`: public channel = `@yourchannel`; private = the `-100…` id.
4. Optional: `TELEGRAM_MIN_EDGE` (default 5), `TELEGRAM_MAX_ALERTS` (default 15).
5. Confirm wiring: `curl -X POST "$URL/api/telegram/notify?test=1&secret=$CRON_SECRET"`
   → a test message should appear in the channel. Then real picks post on each
   ingest, or manually via `/api/telegram/notify`.

## 3. AI analysis — Claude

1. Set `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`).
2. The static analysis rubric is sent with **prompt caching** (`cache_control`),
   so repeated generations are cheaper and faster. Per-match data is the only
   uncached part. See `src/lib/ai/analysis.ts`.

## 4. The value engine (no key needed)

`src/lib/models/devig.ts` is the generic value engine: for each market it strips
each bookmaker's margin, averages to a **no-vig consensus fair probability**, then
compares the **best available price** to that fair price — `edge = best / fair − 1`.
This is standard line-shopping value and works for any sport with ≥2 books, no team
stats required. (`src/lib/models/football.ts` keeps a Poisson goals model for when
paid API-Football stats are wired in to sharpen football specifically.)

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
