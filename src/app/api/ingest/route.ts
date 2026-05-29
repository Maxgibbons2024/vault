import { NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel Pro: allow the full ingest + alert pass

// Triggered on a schedule (Supabase / Vercel Cron) or manually.
// Auth: send `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`.
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured (dev) — allow
  const header = request.headers.get("authorization");
  const url = new URL(request.url);
  return (
    header === `Bearer ${secret}` || url.searchParams.get("secret") === secret
  );
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runIngestion();
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
