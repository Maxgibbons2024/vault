import type {
  Analysis,
  Event,
  Opportunity,
  ResultRow,
  Subscription,
  User,
} from "./types";

// All dates are generated relative to "now" so the dashboard always looks fresh.
const now = new Date();
const day = 24 * 60 * 60 * 1000;
const iso = (offsetDays: number, hour = 19, min = 45) => {
  const d = new Date(now.getTime() + offsetDays * day);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};
const pastIso = (offsetDays: number) =>
  new Date(now.getTime() - offsetDays * day).toISOString();

export const seedUsers: User[] = [
  {
    id: "u_demo",
    email: "demo@vaultbets.ai",
    name: "Demo User",
    password: "demo1234",
    role: "user",
    createdAt: pastIso(40),
  },
  {
    id: "u_admin",
    email: "admin@vaultbets.ai",
    name: "Platform Admin",
    password: "admin1234",
    role: "admin",
    createdAt: pastIso(120),
  },
  {
    id: "u_sara",
    email: "sara@example.com",
    name: "Sara Khan",
    password: "password",
    role: "user",
    createdAt: pastIso(12),
  },
  {
    id: "u_mike",
    email: "mike@example.com",
    name: "Mike Owens",
    password: "password",
    role: "user",
    createdAt: pastIso(5),
  },
];

export const seedSubscriptions: Subscription[] = [
  {
    id: "sub_demo",
    userId: "u_demo",
    plan: "pro",
    status: "active",
    currentPeriodEnd: iso(24, 0, 0),
  },
  {
    id: "sub_sara",
    userId: "u_sara",
    plan: "starter",
    status: "active",
    currentPeriodEnd: iso(8, 0, 0),
  },
  {
    id: "sub_mike",
    userId: "u_mike",
    plan: "free",
    status: "active",
    currentPeriodEnd: iso(2, 0, 0),
  },
];

export const seedEvents: Event[] = [
  {
    id: "ev_psg_inter",
    sport: "football",
    competition: "UEFA Champions League",
    homeName: "PSG",
    awayName: "Inter Milan",
    startsAt: iso(0, 20, 0),
    venue: "Parc des Princes",
    marketConfidence: 78,
    status: "scheduled",
  },
  {
    id: "ev_ars_city",
    sport: "football",
    competition: "Premier League",
    homeName: "Arsenal",
    awayName: "Manchester City",
    startsAt: iso(1, 17, 30),
    venue: "Emirates Stadium",
    marketConfidence: 64,
    status: "scheduled",
  },
  {
    id: "ev_rma_bar",
    sport: "football",
    competition: "LaLiga",
    homeName: "Real Madrid",
    awayName: "Barcelona",
    startsAt: iso(2, 20, 0),
    venue: "Santiago Bernabéu",
    marketConfidence: 71,
    status: "scheduled",
  },
  {
    id: "ev_bay_dort",
    sport: "football",
    competition: "Bundesliga",
    homeName: "Bayern Munich",
    awayName: "Borussia Dortmund",
    startsAt: iso(3, 18, 30),
    venue: "Allianz Arena",
    marketConfidence: 69,
    status: "scheduled",
  },
  {
    id: "ev_alc_sin",
    sport: "tennis",
    competition: "ATP Masters 1000 — Semi Final",
    homeName: "C. Alcaraz",
    awayName: "J. Sinner",
    startsAt: iso(0, 15, 0),
    venue: "Centre Court",
    marketConfidence: 60,
    status: "scheduled",
  },
  {
    id: "ev_swi_gauff",
    sport: "tennis",
    competition: "WTA 1000 — Final",
    homeName: "I. Świątek",
    awayName: "C. Gauff",
    startsAt: iso(1, 14, 0),
    venue: "Stadium 1",
    marketConfidence: 66,
    status: "scheduled",
  },
  {
    id: "ev_jones_aspinall",
    sport: "ufc",
    competition: "UFC 312 — Heavyweight Title",
    homeName: "J. Jones",
    awayName: "T. Aspinall",
    startsAt: iso(2, 22, 0),
    venue: "T-Mobile Arena",
    marketConfidence: 58,
    status: "scheduled",
  },
  {
    id: "ev_makh_oliveira",
    sport: "ufc",
    competition: "UFC 313 — Lightweight",
    homeName: "I. Makhachev",
    awayName: "C. Oliveira",
    startsAt: iso(4, 22, 0),
    venue: "Etihad Arena",
    marketConfidence: 63,
    status: "scheduled",
  },
  {
    id: "ev_ascot_240",
    sport: "horse-racing",
    competition: "Ascot — 2:40 Handicap",
    homeName: "Night Sovereign",
    awayName: "Field of 11",
    startsAt: iso(0, 14, 40),
    venue: "Ascot",
    marketConfidence: 55,
    status: "scheduled",
  },
  {
    id: "ev_cheltenham_315",
    sport: "horse-racing",
    competition: "Cheltenham — 3:15 Novices' Chase",
    homeName: "Galway Tide",
    awayName: "Field of 8",
    startsAt: iso(1, 15, 15),
    venue: "Cheltenham",
    marketConfidence: 61,
    status: "scheduled",
  },
];

const footballSections = (home: string, away: string) => [
  {
    heading: "Overview",
    body: `${home} host ${away} in a fixture that the model flags as a clear value pocket. Implied bookmaker probabilities are skewed by public money on the favourite, leaving the goals and team-total markets mispriced versus our simulation baseline.`,
  },
  {
    heading: "Recent Form",
    body: `${home} have scored in 9 of their last 10 home matches and average 2.3 goals at home this season. ${away} arrive on the back of a congested fixture list, with rotation expected and underlying defensive numbers trending the wrong way (xGA up 18% over the last five).`,
  },
  {
    heading: "Head To Head",
    body: `The last six meetings have produced an average of 3.1 goals, with ${home} winning the territorial battle in five of them. Both-teams-to-score has landed in four of the last five.`,
  },
  {
    heading: "Key Statistics",
    body: `${home} rank top-3 in the competition for shots in the box (14.2/game) and progressive carries. ${away} concede 1.6 big chances per away game. Set-piece xG differential strongly favours the hosts.`,
  },
  {
    heading: "Injuries And Team News",
    body: `${away} are without two first-choice centre-backs and their primary defensive midfielder. ${home} are at close to full strength, with their main striker passed fit after a knock.`,
  },
  {
    heading: "Expected Goals Analysis",
    body: `Our 10,000-run Monte Carlo simulation projects ${home} xG at 2.05 and ${away} at 1.15. The most likely correct scores are 2-1 and 2-0. Total goals over 2.5 returns in 58% of simulations.`,
  },
  {
    heading: "Market Evaluation",
    body: `Sharp books opened ${home} team-total over 1.5 at 1.85 and it has drifted to 2.05 on recreational money for the away side. That drift is the inefficiency our edge calculation is capturing.`,
  },
  {
    heading: "Potential Betting Angles",
    body: `Primary angle: ${home} over 1.5 team goals. Secondary: over 2.5 match goals. Speculative: ${home} -1 Asian handicap as a lower-confidence alternative.`,
  },
  {
    heading: "Risk Factors",
    body: `A early ${away} goal could flip game state and reduce ${home}'s attacking urgency. Weather forecasts suggest possible heavy rain which historically suppresses total goals by ~0.2.`,
  },
  {
    heading: "Conclusion",
    body: `The combination of squad availability, xG projection and a drifting price gives a defensible edge on the ${home} team-total line. We rate this a disciplined, mid-stake opportunity — not a lock.`,
  },
];

const genericSections = (a: string, b: string) => [
  { heading: "Overview", body: `${a} vs ${b} screens as a value spot where the model's projected probability diverges meaningfully from the market price.` },
  { heading: "Recent Form", body: `${a} enters with strong recent underlying metrics; ${b} has been competitive but is over-rated by closing-line movement.` },
  { heading: "Head To Head", body: `Historical meetings and surface/style matchups slightly favour ${a} relative to the implied market split.` },
  { heading: "Key Statistics", body: `Performance indicators (win rate vs ranked opponents, finishing/closing data) support a tighter contest than the price implies.` },
  { heading: "Injuries And Team News", body: `No material fitness concerns reported; conditioning and camp reports are neutral-to-positive for ${a}.` },
  { heading: "Expected Goals Analysis", body: `Simulation output places the true line closer to even than the posted price, creating the edge captured below.` },
  { heading: "Market Evaluation", body: `Recreational money has shaded the favourite, leaving the alternative side and prop markets priced generously.` },
  { heading: "Potential Betting Angles", body: `Primary angle is the value side outright; a method/total prop offers a lower-confidence secondary.` },
  { heading: "Risk Factors", body: `Variance is inherently high in this market; a single momentum swing can decide the outcome regardless of the edge.` },
  { heading: "Conclusion", body: `A defensible, disciplined value position rather than a high-confidence selection.` },
];

export const seedAnalyses: Analysis[] = seedEvents.map((e) => ({
  id: `an_${e.id}`,
  eventId: e.id,
  premium: e.id !== "ev_ars_city", // leave one free as a teaser
  published: true,
  publishedAt: pastIso(1),
  summary:
    e.sport === "football"
      ? `Model projects a goals-leaning script with ${e.homeName} controlling territory. The team-total market is the cleanest expression of the edge.`
      : `Model rates ${e.homeName} as under-priced versus simulated win probability. Value sits on the main line and a method/total prop.`,
  sections:
    e.sport === "football"
      ? footballSections(e.homeName, e.awayName)
      : genericSections(e.homeName, e.awayName),
}));

export const seedOpportunities: Opportunity[] = [
  {
    id: "op_psg_1",
    eventId: "ev_psg_inter",
    market: "PSG Over 1.5 Team Goals",
    bookmakerOdds: 2.05,
    fairOdds: 1.75,
    edgePct: 17,
    confidence: 7.5,
    reasoning:
      "PSG average 2.3 home goals; Inter missing two centre-backs. Simulation lands 1.5+ PSG goals in 64% of runs vs 49% implied.",
  },
  {
    id: "op_psg_2",
    eventId: "ev_psg_inter",
    market: "Over 2.5 Match Goals",
    bookmakerOdds: 1.95,
    fairOdds: 1.72,
    edgePct: 13,
    confidence: 6.8,
    reasoning:
      "H2H averages 3.1 goals and projected combined xG is 3.2. Drift on the away side has lengthened the over price.",
  },
  {
    id: "op_rma_1",
    eventId: "ev_rma_bar",
    market: "Both Teams To Score",
    bookmakerOdds: 1.7,
    fairOdds: 1.55,
    edgePct: 10,
    confidence: 7.0,
    reasoning:
      "El Clásico has returned BTTS in 4 of last 5; both defences carrying injuries. Model probability 65% vs 59% implied.",
  },
  {
    id: "op_alc_1",
    eventId: "ev_alc_sin",
    market: "Match Over 22.5 Games",
    bookmakerOdds: 1.9,
    fairOdds: 1.7,
    edgePct: 12,
    confidence: 6.5,
    reasoning:
      "Both hold serve at elite rates on this surface; recent meetings have gone deep. Tiebreak frequency supports the over.",
  },
  {
    id: "op_jones_1",
    eventId: "ev_jones_aspinall",
    market: "Aspinall By KO/TKO",
    bookmakerOdds: 3.4,
    fairOdds: 2.8,
    edgePct: 21,
    confidence: 6.0,
    reasoning:
      "Aspinall's hand speed and output edge in the first two rounds is under-priced given Jones' layoff. Higher variance, higher payout.",
  },
  {
    id: "op_ascot_1",
    eventId: "ev_ascot_240",
    market: "Night Sovereign To Place",
    bookmakerOdds: 2.2,
    fairOdds: 1.9,
    edgePct: 14,
    confidence: 6.2,
    reasoning:
      "Strong recent course form and favourable draw. Speed figures rank top-2 in the field; place market priced off outright odds.",
  },
];

export const seedResults: ResultRow[] = [
  { id: "r1", date: pastIso(1), sport: "football", event: "Liverpool vs Chelsea", opportunity: "Over 2.5 Goals", marketOdds: 1.95, fairOdds: 1.72, status: "won", roi: 95 },
  { id: "r2", date: pastIso(2), sport: "football", event: "Juventus vs Napoli", opportunity: "Juventus Clean Sheet", marketOdds: 2.6, fairOdds: 2.2, status: "lost", roi: -100 },
  { id: "r3", date: pastIso(3), sport: "tennis", event: "Djokovic vs Zverev", opportunity: "Over 22.5 Games", marketOdds: 1.85, fairOdds: 1.66, status: "won", roi: 85 },
  { id: "r4", date: pastIso(4), sport: "ufc", event: "Pereira vs Hill", opportunity: "Pereira By KO", marketOdds: 2.1, fairOdds: 1.8, status: "won", roi: 110 },
  { id: "r5", date: pastIso(5), sport: "football", event: "Atletico vs Sevilla", opportunity: "Under 2.5 Goals", marketOdds: 1.8, fairOdds: 1.6, status: "won", roi: 80 },
  { id: "r6", date: pastIso(6), sport: "horse-racing", event: "Ascot 3:10", opportunity: "Royal Tempo To Win", marketOdds: 4.5, fairOdds: 3.6, status: "lost", roi: -100 },
  { id: "r7", date: pastIso(7), sport: "tennis", event: "Sabalenka vs Rybakina", opportunity: "Sabalenka -3.5 Games", marketOdds: 1.9, fairOdds: 1.7, status: "won", roi: 90 },
  { id: "r8", date: pastIso(8), sport: "football", event: "Inter vs Milan", opportunity: "BTTS", marketOdds: 1.75, fairOdds: 1.58, status: "won", roi: 75 },
  { id: "r9", date: pastIso(9), sport: "ufc", event: "Makhachev vs Volk", opportunity: "Fight Goes Distance", marketOdds: 2.0, fairOdds: 1.78, status: "lost", roi: -100 },
  { id: "r10", date: pastIso(10), sport: "football", event: "Dortmund vs Leipzig", opportunity: "Over 3.5 Goals", marketOdds: 2.5, fairOdds: 2.1, status: "won", roi: 150 },
  { id: "r11", date: pastIso(11), sport: "tennis", event: "Medvedev vs Rune", opportunity: "Medvedev To Win", marketOdds: 1.7, fairOdds: 1.55, status: "won", roi: 70 },
  { id: "r12", date: pastIso(0), sport: "football", event: "PSG vs Inter", opportunity: "PSG Over 1.5 Team Goals", marketOdds: 2.05, fairOdds: 1.75, status: "pending", roi: 0 },
];
