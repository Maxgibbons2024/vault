import { NextResponse } from "next/server";
import { runValueAlerts } from "@/lib/notify/value-alerts";
import {
  postAndPinLegend,
  sendTelegramMessage,
  tenantTelegram,
} from "@/lib/notify/telegram";
import { getTenantBySlug, listTenants } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Per-tenant value alerts. Auth via CRON_SECRET.
//   (no flag) → run alerts for ALL active tenants
//   ?test=1&slug=<tenant>   → send a test message to that tenant's channel
//   ?legend=1&slug=<tenant> → (re)post + pin the glossary to that tenant's channel
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization");
  const url = new URL(request.url);
  return header === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

async function resolveTenant(slug: string | null) {
  if (slug) return getTenantBySlug(slug);
  const tenants = await listTenants();
  return tenants.find((t) => t.telegramBotToken && t.telegramChannelId);
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (url.searchParams.get("legend") === "1" || url.searchParams.get("test") === "1") {
    const tenant = await resolveTenant(slug);
    const creds = tenant && tenantTelegram(tenant.telegramBotToken, tenant.telegramChannelId);
    if (!tenant || !creds) {
      return NextResponse.json({ ok: false, error: "No tenant with Telegram configured." }, { status: 400 });
    }
    if (url.searchParams.get("legend") === "1") {
      const ok = await postAndPinLegend(creds, tenant.name);
      return NextResponse.json({ ok, legend: true, tenant: tenant.slug });
    }
    const ok = await sendTelegramMessage(
      creds,
      `✅ <b>${tenant.name}</b> connected. Value alerts will appear here.\n<i>Educational analysis only — not betting advice.</i>`,
    );
    return NextResponse.json({ ok, test: true, tenant: tenant.slug });
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
