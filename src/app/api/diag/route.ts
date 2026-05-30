import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { dbEnabled } from "@/lib/db";
import { oddsApiEnabled } from "@/lib/providers/the-odds-api";
import { telegramEnabled } from "@/lib/notify/telegram";
import { anthropicEnabled } from "@/lib/ai/analysis";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Diagnostics (CRON_SECRET-protected). Reports which integrations are armed and
// does a tiny live Anthropic call to surface key/model errors precisely.
// Never returns secret values.
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization");
  const url = new URL(request.url);
  return header === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
  const anthropic: { enabled: boolean; model: string; ok: boolean; error?: string } = {
    enabled: anthropicEnabled,
    model,
    ok: false,
  };

  if (anthropicEnabled) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const msg = await client.messages.create({
        model,
        max_tokens: 8,
        messages: [{ role: "user", content: "Reply with the single word: ok" }],
      });
      anthropic.ok = msg.content.some(
        (b) => b.type === "text" && /ok/i.test((b as { text: string }).text),
      );
    } catch (err) {
      anthropic.error = (err as Error).message;
    }
  }

  return NextResponse.json({
    db: dbEnabled,
    oddsApi: oddsApiEnabled,
    telegram: telegramEnabled,
    anthropic,
    baseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
  });
}

export const GET = handle;
export const POST = handle;
