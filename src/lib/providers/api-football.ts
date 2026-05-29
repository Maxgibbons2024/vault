// API-Football (api-sports.io) fixtures provider.
// Docs: https://www.api-football.com/documentation-v3
// Set API_FOOTBALL_KEY to enable. Without it, ingestion uses no live fixtures.

export const apiFootballEnabled = !!process.env.API_FOOTBALL_KEY;

const BASE = "https://v3.football.api-sports.io";

export interface RawFixture {
  externalId: string;
  competition: string;
  homeName: string;
  awayName: string;
  startsAt: string; // ISO
  venue?: string;
  status: "scheduled" | "live" | "finished";
  // Optional context the model/AI can use
  homeForm?: string;
  awayForm?: string;
  goalsHome?: number | null;
  goalsAway?: number | null;
}

interface ApiFootballResponse {
  response: Array<{
    fixture: {
      id: number;
      date: string;
      status: { short: string };
      venue?: { name?: string };
    };
    league: { name: string };
    teams: { home: { name: string }; away: { name: string } };
    goals: { home: number | null; away: number | null };
  }>;
}

function mapStatus(short: string): RawFixture["status"] {
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["1H", "2H", "HT", "ET", "LIVE", "P"].includes(short)) return "live";
  return "scheduled";
}

// Fetch fixtures for a set of league ids within a date window.
// `from`/`to` accept explicit YYYY-MM-DD strings (used for historical/free-tier
// seasons); otherwise it defaults to today → +toDays. This lets the free plan
// (seasons 2021–2023 only) still return real fixtures via an in-season window.
export async function fetchFootballFixtures(opts: {
  leagueIds: number[];
  season: number;
  toDays?: number;
  from?: string;
  to?: string;
}): Promise<RawFixture[]> {
  if (!apiFootballEnabled) return [];
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const from = opts.from ?? fmt(new Date());
  const to = opts.to ?? fmt(new Date(Date.now() + (opts.toDays ?? 7) * 864e5));

  const all: RawFixture[] = [];
  for (const league of opts.leagueIds) {
    const url = `${BASE}/fixtures?league=${league}&season=${opts.season}&from=${from}&to=${to}`;
    const res = await fetch(url, {
      headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
      // Revalidate hourly; ingestion is the source of truth anyway.
      next: { revalidate: 3600 },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as ApiFootballResponse;
    for (const item of data.response ?? []) {
      all.push({
        externalId: `af_${item.fixture.id}`,
        competition: item.league.name,
        homeName: item.teams.home.name,
        awayName: item.teams.away.name,
        startsAt: item.fixture.date,
        venue: item.fixture.venue?.name,
        status: mapStatus(item.fixture.status.short),
        goalsHome: item.goals.home,
        goalsAway: item.goals.away,
      });
    }
  }
  return all;
}
