import Link from "next/link";
import { Logo, Disclaimer } from "@/components/brand";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";
import { PricingCards } from "@/components/pricing";
import { SPORTS } from "@/lib/types";
import { listEvents, performanceStats } from "@/lib/store";
import { formatDate, relativeDay } from "@/lib/format";

const FEATURES = [
  {
    title: "AI Match Analysis",
    body: "Full statistical breakdowns — form, xG, head-to-head, injuries and market evaluation — generated for every fixture.",
    icon: "🧠",
  },
  {
    title: "Value Detection",
    body: "We compare bookmaker odds against simulated fair odds to surface where the market may be mispriced.",
    icon: "🎯",
  },
  {
    title: "Edge & Confidence Scoring",
    body: "Every opportunity carries a calculated edge percentage and a 0–10 confidence rating, with written reasoning.",
    icon: "📊",
  },
  {
    title: "Transparent Track Record",
    body: "Historical recommendations with results and ROI, so you can evaluate the analysis honestly over time.",
    icon: "📒",
  },
  {
    title: "Multi-Sport Coverage",
    body: "Football, tennis, UFC and horse racing — with more markets being added continuously.",
    icon: "🌍",
  },
  {
    title: "Built To Scale",
    body: "Architected for live Sports & Odds APIs, email and Telegram alerts, and mobile apps.",
    icon: "⚡",
  },
];

export default async function LandingPage() {
  const [perf, allEvents] = await Promise.all([performanceStats(), listEvents()]);
  const upcoming = allEvents.slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#sports" className="hover:text-ink">Sports</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <ButtonLink href="/login" variant="ghost" size="sm">
              Log in
            </ButtonLink>
            <ButtonLink href="/signup" size="sm">
              Start Free Trial
            </ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="vb-grid-bg absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 lg:pt-28">
          <div className="vb-fade-up mx-auto max-w-3xl text-center">
            <Badge tone="brand" className="mx-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              AI-powered sports betting intelligence
            </Badge>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Find Value Before
              <br />
              <span className="bg-gradient-to-r from-brand-soft to-accent-soft bg-clip-text text-transparent">
                The Market Does.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              AI-powered sports betting intelligence that helps you identify
              potential value opportunities across football, tennis, UFC, horse
              racing and more.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/signup" size="lg">
                Start Free Trial
              </ButtonLink>
              <ButtonLink href="/login" variant="outline" size="lg">
                View Analysis
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-faint">
              No card required for the trial · Cancel anytime
            </p>
          </div>

          {/* Live stat strip */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Tracked win rate", value: `${perf.winRate.toFixed(0)}%` },
              { label: "Settled picks", value: perf.settled },
              { label: "Avg ROI / pick", value: `${perf.avgRoi.toFixed(0)}%` },
              { label: "Sports covered", value: SPORTS.length },
            ].map((s) => (
              <Card key={s.label} className="p-4 text-center">
                <p className="text-2xl font-bold text-ink">{s.value}</p>
                <p className="mt-1 text-xs text-muted">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming preview */}
      <section className="border-y border-border bg-bg-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Live board"
            title="Today's analysed fixtures"
            subtitle="A snapshot of events our model is currently evaluating."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((e) => (
              <Card key={e.id} className="p-4">
                <p className="truncate text-xs text-brand-soft">{e.competition}</p>
                <p className="mt-2 font-semibold text-ink">
                  {e.homeName} <span className="text-faint">vs</span> {e.awayName}
                </p>
                <p className="mt-1 text-xs text-faint">
                  {relativeDay(e.startsAt)} · {formatDate(e.startsAt)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="What you get"
          title="A betting terminal, powered by AI"
          subtitle="Designed with the rigour of a trading desk and the clarity of consumer software."
          className="max-w-2xl"
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6 transition hover:border-brand/40">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-xl">
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Sports */}
      <section id="sports" className="border-y border-border bg-bg-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="Coverage" title="Every market, one platform" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SPORTS.map((s) => (
              <Card
                key={s.id}
                className="flex items-center gap-4 p-6 transition hover:border-accent/40"
              >
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <p className="font-semibold text-ink">{s.label}</p>
                  <p className="text-xs text-muted">Daily analysis</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple monthly plans"
          subtitle="Cancel anytime. Premium analysis is unlocked the moment you subscribe."
          className="text-center [&_p]:mx-auto [&>h2]:mx-auto"
        />
        <div className="mt-10">
          <PricingCards />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <Card className="relative overflow-hidden border-brand/30 p-10 text-center">
          <div className="vb-grid-bg absolute inset-0 opacity-30" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-ink">
              Ready to find your edge?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Join VaultBets AI and turn publicly available sports data into
              structured, transparent betting intelligence.
            </p>
            <div className="mt-8 flex justify-center">
              <ButtonLink href="/signup" size="lg">
                Start Free Trial
              </ButtonLink>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <Logo />
            <nav className="flex gap-6 text-sm text-muted">
              <Link href="/login" className="hover:text-ink">Log in</Link>
              <Link href="/signup" className="hover:text-ink">Sign up</Link>
              <a href="#pricing" className="hover:text-ink">Pricing</a>
            </nav>
          </div>
          <Disclaimer />
          <p className="text-xs text-faint">
            © {new Date().getFullYear()} VaultBets AI. For users aged 18+. Please
            gamble responsibly — BeGambleAware.org.
          </p>
        </div>
      </footer>
    </div>
  );
}
