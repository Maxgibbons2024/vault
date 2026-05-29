import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisSection } from "../types";

// Generates the written match analysis. Uses Claude when ANTHROPIC_API_KEY is
// set (with prompt caching on the static rubric), otherwise a deterministic
// template. Always degrades gracefully — a failed API call falls back to template.

export const anthropicEnabled = !!process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

const anthropic = anthropicEnabled
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  : null;

const SECTION_HEADINGS = [
  "Overview",
  "Recent Form",
  "Head To Head",
  "Key Statistics",
  "Injuries And Team News",
  "Expected Goals Analysis",
  "Market Evaluation",
  "Potential Betting Angles",
  "Risk Factors",
  "Conclusion",
];

// Large, STATIC instruction block — cached so repeat calls are cheap/fast.
const RUBRIC = `You are the lead analyst for VaultBets AI, an educational sports betting analysis platform.

Write a professional, neutral, data-driven match analysis. Hard rules:
- This is EDUCATIONAL ANALYSIS ONLY. Never instruct the reader to place a bet or guarantee outcomes. Use measured language ("the model projects", "this suggests value").
- Ground every claim in the supplied data (form, expected goals, model probabilities, odds, opportunities). Do not invent specific injuries, scores, or stats that are not provided.
- Be concise and specific. 2-4 sentences per section.
- Produce EXACTLY these sections, in order: ${SECTION_HEADINGS.join(", ")}.

Return ONLY valid JSON (no markdown fences) of the shape:
{"summary": string, "sections": [{"heading": string, "body": string}]}`;

export interface AnalysisInput {
  sport: string;
  competition: string;
  homeName: string;
  awayName: string;
  startsAt: string;
  facts?: Record<string, unknown>; // form, goals averages, etc.
  probabilities?: Record<string, number>;
  opportunities?: Array<{ market: string; bookmakerOdds: number; fairOdds: number; edgePct: number }>;
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
        max_tokens: 1800,
        system: [
          {
            type: "text",
            text: RUBRIC,
            cache_control: { type: "ephemeral" }, // cache the static rubric
          },
        ],
        messages: [
          {
            role: "user",
            content: `Generate the analysis for this match using only the data below.\n\n${JSON.stringify(input, null, 2)}`,
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
      if (parsed.summary && Array.isArray(parsed.sections)) {
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

function templateAnalysis(input: AnalysisInput): GeneratedAnalysis {
  const { homeName: h, awayName: a } = input;
  const p = input.probabilities ?? {};
  const pct = (v?: number) => (v != null ? `${Math.round(v * 100)}%` : "—");
  const body = (s: string) => s;
  return {
    summary: `Model-led preview of ${h} vs ${a}. Projected outcome split: ${h} ${pct(p.homeWin)}, draw ${pct(p.draw)}, ${a} ${pct(p.awayWin)}. Value, if any, is listed in the opportunities below.`,
    sections: SECTION_HEADINGS.map((heading) => ({
      heading,
      body: body(sectionBody(heading, input)),
    })),
    generatedBy: "template",
  };
}

function sectionBody(heading: string, input: AnalysisInput): string {
  const { homeName: h, awayName: a } = input;
  const p = input.probabilities ?? {};
  switch (heading) {
    case "Overview":
      return `${h} host ${a} in ${input.competition}. The model evaluates the market against simulated probabilities to identify any mispricing.`;
    case "Expected Goals Analysis":
      return `Projected expected goals: ${h} ${p.lambdaHome?.toFixed(2) ?? "n/a"}, ${a} ${p.lambdaAway?.toFixed(2) ?? "n/a"}. Over 2.5 goals lands in ${p.over25 != null ? Math.round(p.over25 * 100) + "%" : "n/a"} of simulations.`;
    case "Market Evaluation":
      return input.opportunities?.length
        ? `The clearest edge is on ${input.opportunities[0].market} (book ${input.opportunities[0].bookmakerOdds} vs fair ${input.opportunities[0].fairOdds}).`
        : `No standout discrepancy between the market and the model was detected for the main markets.`;
    case "Potential Betting Angles":
      return input.opportunities?.length
        ? `Primary angle: ${input.opportunities[0].market}. Treat as a disciplined value position, not a certainty.`
        : `No value angles flagged at current prices.`;
    case "Risk Factors":
      return `Single-match variance is high. Early game state, rotation and conditions can override the projected edge.`;
    case "Conclusion":
      return `A defensible, model-supported view of ${h} vs ${a}. Educational analysis only — not betting advice.`;
    default:
      return `Based on the supplied data for ${h} vs ${a}, this section is generated from the model inputs. Connect richer stats feeds for deeper detail.`;
  }
}
