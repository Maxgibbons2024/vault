// Builds and posts value-opportunity alerts to Telegram. Idempotent via a stable
// dedupe key (event externalId + market) stored in SentAlert, so re-runs never
// repost the same pick even though Opportunity rows are recreated each ingest.

import { sendTelegramMessage, telegramEnabled } from "./telegram";
import {
  hasSentAlert,
  listEvents,
  listOpportunities,
  recordSentAlert,
} from "../store";
import { SPORTS } from "../types";
import { formatDate } from "../format";

export interface AlertSummary {
  enabled: boolean;
  candidates: number;
  sent: number;
  skipped: number;
  notes: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function runValueAlerts(): Promise<AlertSummary> {
  const summary: AlertSummary = {
    enabled: telegramEnabled,
    candidates: 0,
    sent: 0,
    skipped: 0,
    notes: [],
  };
  if (!telegramEnabled) {
    summary.notes.push("TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID not set — skipped.");
    return summary;
  }

  const minEdge = Number(process.env.TELEGRAM_MIN_EDGE) || 5;
  const maxAlerts = Number(process.env.TELEGRAM_MAX_ALERTS) || 15;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  const [events, opportunities] = await Promise.all([
    listEvents(),
    listOpportunities(),
  ]);
  const now = Date.now();
  const eventById = new Map(events.map((e) => [e.id, e]));

  // Upcoming events only, opportunities at/above threshold, strongest first.
  const candidates = opportunities
    .map((op) => ({ op, event: eventById.get(op.eventId) }))
    .filter(
      (x) =>
        x.event &&
        new Date(x.event.startsAt).getTime() > now &&
        x.op.edgePct >= minEdge,
    )
    .sort((a, b) => b.op.edgePct - a.op.edgePct)
    .slice(0, maxAlerts);

  summary.candidates = candidates.length;

  for (const { op, event } of candidates) {
    if (!event) continue;
    const key = `${event.externalId ?? event.id}:${op.market}`;
    if (await hasSentAlert(key)) {
      summary.skipped += 1;
      continue;
    }
    const icon = SPORTS.find((s) => s.id === event.sport)?.icon ?? "🎯";
    const link = baseUrl ? `${baseUrl}/analysis/${event.id}` : "";
    const html = [
      `${icon} <b>${escapeHtml(event.homeName)} vs ${escapeHtml(event.awayName)}</b>`,
      `🏆 ${escapeHtml(event.competition)} · ${formatDate(event.startsAt)}`,
      `🎯 <b>${escapeHtml(op.market)}</b>`,
      `💰 Best ${op.bookmakerOdds.toFixed(2)}  ·  Fair ${op.fairOdds.toFixed(2)}  ·  Edge <b>+${op.edgePct}%</b>  ·  Conf ${op.confidence.toFixed(1)}/10`,
      link ? `🔗 <a href="${link}">Full analysis</a>` : "",
      `<i>Educational analysis only — not betting advice.</i>`,
    ]
      .filter(Boolean)
      .join("\n");

    const ok = await sendTelegramMessage(html);
    if (ok) {
      await recordSentAlert(key);
      summary.sent += 1;
      await sleep(150); // stay under Telegram per-chat rate limits
    } else {
      summary.notes.push(`send failed for ${key}`);
    }
  }

  return summary;
}
