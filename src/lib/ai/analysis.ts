import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisSection, EventMetrics } from "../types";

// Generates the written match analysis. Uses Claude when ANTHROPIC_API_KEY is
// set (with prompt caching on the static rubric), otherwise a deterministic
// template. Always degrades gracefully — a failed API call falls back to template.

export const anthropicEnabled = !!process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

const anthropic = anthropicEnabled
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  : null;

// Core sections — all grounded in market + model data we always have.
const CORE_SECTIONS = [
  "The Matchup",
  "Market Snapshot",
  "Where The Value Is",
  "Probability Breakdown",
  "Bookmaker Consensus",
  "Confidence Rating",
  "Key Risks",
  "The Bottom Line",
];

// Large, STATIC instruction block — cached so repeat calls are cheap/fast.
const RUBRIC = `You are the lead analyst for VaultBets AI, an educational sports-betting analysis platform. You write the match report that members read before forming their own view.

VOICE & STYLE
- Clear, engaging and confident — but never hype. Sound like a sharp analyst who respects the reader's intelligence.
- Professional yet accessible: explain WHY behind every number so a smart newcomer follows it and a pro respects it. Translate jargon the first time you use it (e.g. "no-vig fair price — the true odds once the bookmaker's margin is stripped out").
- Lead with reasoning, not just conclusions. Build trust by showing the logic: market consensus → fair price → where the edge is → how confident we are → what could go wrong.
- Concrete and specific: cite the actual probabilities, prices and edges provided. 3-6 sentences per section.

HARD RULES (non-negotiable — this protects the platform's credibility)
- EDUCATIONAL ANALYSIS ONLY. Never tell the reader to bet, and never guarantee an outcome. Use measured language ("the model rates", "the market implies", "this points to value").
- Use ONLY the data provided in the payload. NEVER invent specific stats — no made-up xG, form runs, injuries, weather, line-ups, head-to-head records or scores. If a factor is not in the data, you may mention it as "a variable to weigh" but you must NOT state it as fact.
- All probabilities and edges come from the supplied market data (de-vig consensus across bookmakers). Frame edge as VALUE versus the consensus price, explicitly NOT as win probability.

SECTIONS
- Always produce these core sections, in order: ${CORE_SECTIONS.join(", ")}.
- If — and only if — the payload includes a "stats" object with real data (recentForm, expectedGoals, injuries, weather, headToHead, venue), ADD the relevant extra sections (e.g. "Recent Form", "Expected Goals", "Injuries & Team News") using that real data, placed before "Key Risks".

OUTPUT
Return ONLY valid JSON (no markdown fences):
{"summary": string, "sections": [{"heading": string, "body": string}]}
The summary is 2-3 punchy sentences a reader sees first: the headline read on the match and the single clearest value angle (or "no clear edge" if none).`;

export interface AnalysisMarketOutcome {
  name: string;
  label: string;
  fairProb: number;
  fairOdds: number;
  bestPrice: number;
  edgePct: number;
}

export interface AnalysisInput {
  sport: string;
  competition: string;
  homeName: string;
  awayName: string;
  startsAt: string;
  venue?: string | null;
  market?: {
    bookmakerCount: number;
    outcomes: AnalysisMarketOutcome[];
    totals?: AnalysisMarketOutcome[];
    favourite?: { name: string; prob: number };
  };
  opportunities?: Array<{ market: string; bookmakerOdds: number; fairOdds: number; edgePct: number; confidence?: number }>;
  // Future: populated only when a real stats feed is wired in. Never fabricated.
  stats?: Record<string, unknown>;
}

export interface GeneratedAnalysis {
  summary: string;
  sections: AnalysisSection[];
  generatedBy: "template" | "claude";
}

export async function generateAnalysis(
  input: AnalysisInput,
): Promise<GeneratedAnalysis> {
  if (anthropicEnabled && anthropic) {
    try {
      const msg = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2200,
        system: [{ type: "text", text: RUBRIC, cache_control: { type: "ephemeral" } }],
        messages: [
          {
            role: "user",
            content: `Write the VaultBets AI report for this fixture using ONLY the data below.\n\n${JSON.stringify(input, null, 2)}`,
          },
        ],
      });
      const text = msg.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("");
      const parsed = JSON.parse(stripFences(text)) as {
        summary: string;
        sections: AnalysisSection[];
      };
      if (parsed.summary && Array.isArray(parsed.sections) && parsed.sections.length) {
        return { ...parsed, generatedBy: "claude" };
      }
    } catch {
      // fall through to template
    }
  }
  return templateAnalysis(input);
}

function stripFences(s: string) {
  return s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
}

/* ----------------------- Deterministic template ------------------------ */
// Used when Claude isn't configured. Still data-rich and specific — built
// entirely from the real market/model numbers, never fabricated facts.

const pct = (v?: number) => (v != null ? `${Math.round(v * 100)}%` : "—");

function templateAnalysis(input: AnalysisInput): GeneratedAnalysis {
  const { homeName: h, awayName: a, competition } = input;
  const m = input.market;
  const outcomes = m?.outcomes ?? [];
  const fav = [...outcomes].sort((x, y) => y.fairProb - x.fairProb)[0];
  const value = [...outcomes, ...(m?.totals ?? [])]
    .filter((o) => o.edgePct > 0)
    .sort((x, y) => y.edgePct - x.edgePct)[0];
  const books = m?.bookmakerCount ?? 0;

  const probLine = outcomes.length
    ? outcomes.map((o) => `${o.name} ${pct(o.fairProb)}`).join(" · ")
    : "not available";

  const summary = value
    ? `${h} vs ${a}: the market's no-vig consensus makes ${fav ? `${fav.name} the favourite at ${pct(fav.fairProb)}` : "this a close call"}, but the clearest value is ${value.label} — the best available price (${value.bestPrice.toFixed(2)}) beats the fair price (${value.fairOdds.toFixed(2)}) for a +${value.edgePct}% edge.`
    : `${h} vs ${a}: the no-vig consensus across ${books} bookmakers is efficiently priced, with ${fav ? `${fav.name} favoured at ${pct(fav.fairProb)}` : "no strong favourite"} and no standout value at current prices.`;

  const section = (heading: string, body: string) => ({ heading, body });
  const sections: AnalysisSection[] = [
    section(
      "The Matchup",
      `${h} face ${a} in ${competition}. This read is built from the live betting market: we take every bookmaker's prices, strip out their built-in margin to recover the "no-vig" fair odds, and compare them to the best price you can actually get. That gap is where value lives.`,
    ),
    section(
      "Market Snapshot",
      fav
        ? `Across ${books} bookmakers the consensus favours ${fav.name} at ${pct(fav.fairProb)} implied probability. Full split: ${probLine}. ${fav.fairProb > 0.6 ? "That's a decisive favourite — the market sees a clear hierarchy." : "It's a competitive market with no runaway pick, which is often where mispricing hides."}`
        : `Consensus probabilities aren't available for this market yet.`,
    ),
    section(
      "Where The Value Is",
      value
        ? `The model flags ${value.label}: fair price ${value.fairOdds.toFixed(2)} vs a best available ${value.bestPrice.toFixed(2)}, a +${value.edgePct}% edge. An edge like this typically appears when recreational money shades one side and a sharp book is slow to follow — the price drifts past its true value.`
        : `No market currently clears our 5% edge threshold. When the best available price doesn't beat the fair price by a meaningful margin, the disciplined read is to pass.`,
    ),
    section(
      "Probability Breakdown",
      outcomes.length
        ? `No-vig fair probabilities: ${probLine}. Remember these are de-vigged from the market, not a win forecast — they describe the fair price, and our edge measures how far the available price sits from it.`
        : `Probability breakdown will populate once odds are available.`,
    ),
    section(
      "Bookmaker Consensus",
      `${books} bookmakers contribute to this consensus. ${books >= 10 ? "A deep book pool means the fair price is well-anchored, so a surviving edge is more trustworthy." : "A thinner book pool means the fair price is less certain — treat the edge with extra caution."}`,
    ),
    section(
      "Confidence Rating",
      value
        ? `Confidence scales with edge size and how many books agree. This spot rates ${value.edgePct >= 10 ? "strong" : value.edgePct >= 7 ? "solid" : "moderate"} — a real but not outsized gap versus a ${books}-book consensus.`
        : `With no qualifying edge, conviction here is low by design.`,
    ),
    section(
      "Key Risks",
      `Single events carry high variance: team news, line-ups, late market moves and in-game state can all override a pre-game edge. Value is an expectation over many bets, not a promise on any one. We also can't yet factor live injury/weather data into this specific read.`,
    ),
    section(
      "The Bottom Line",
      value
        ? `${value.label} is a disciplined value position — the price is generous versus the consensus, not a sure thing. Stake to your own plan. Educational analysis only — not betting advice.`
        : `Nothing here beats the market by enough to act on. Patience is an edge too. Educational analysis only — not betting advice.`,
    ),
  ];

  return { summary, sections, generatedBy: "template" };
}
