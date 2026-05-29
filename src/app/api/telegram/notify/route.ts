import { NextResponse } from "next/server";
import { runValueAlerts } from "@/lib/notify/value-alerts";
import { sendTelegramMessage, telegramEnabled } from "@/lib/notify/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Manual trigger / cron for value-opportunity alerts.
// Auth: `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`.
// `?test=1` sends a single test message (used to confirm bot + channel wiring).
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
  const url = new URL(request.url);

  if (url.searchParams.get("test") === "1") {
    if (!telegramEnabled) {
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID not set." },
        { status: 400 },
      );
    }
    const ok = await sendTelegramMessage(
      "✅ <b>VaultBets AI</b> connected. Value alerts will appear here.\n<i>Educational analysis only — not betting advice.</i>",
    );
    return NextResponse.json({ ok, test: true });
  }

  try {
    const summary = await runValueAlerts();
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
