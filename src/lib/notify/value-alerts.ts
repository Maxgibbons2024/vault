// Per-tenant value alerts. For each active tenant: select picks from the global
// pool by the tenant's strategy, record them as TenantPicks (dedupe + ledger),
// and post any not-yet-sent picks to the tenant's own Telegram channel.

import { sendTelegram, tenantTelegram, escapeHtml } from "./telegram";
import {
  listEvents,
  listOpportunities,
  listTenants,
  upsertTenantPick,
  markTenantPickSent,
} from "../store";
import { selectForTenant } from "../strategy";
import { SPORTS, type Event } from "../types";
import { formatDate } from "../format";

export interface AlertSummary {
  tenants: number;
  picksRecorded: number;
  sent: number;
  byTenant: Record<string, { recorded: number; sent: number }>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickMessage(event: Event, market: string, best: number, fair: number, edge: number, conf: number, link: string) {
  const icon = SPORTS.find((s) => s.id === event.sport)?.icon ?? "🎯";
  return [
    `${icon} <b>${escapeHtml(event.homeName)} vs ${escapeHtml(event.awayName)}</b>`,
    `🏆 ${escapeHtml(event.competition)} · ${formatDate(event.startsAt)}`,
    `🎯 <b>${escapeHtml(market)}</b>`,
    `💰 Best ${best.toFixed(2)}  ·  Fair ${fair.toFixed(2)}  ·  Edge <b>+${edge}%</b>  ·  Conf ${conf.toFixed(1)}/10`,
    link ? `🔗 <a href="${link}">Full analysis</a>` : "",
    `<i>Educational analysis only — not betting advice.</i>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function runValueAlerts(): Promise<AlertSummary> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const [tenants, events, opportunities] = await Promise.all([
    listTenants(),
    listEvents(),
    listOpportunities(),
  ]);
  const active = tenants.filter((t) => t.status === "active");

  const summary: AlertSummary = { tenants: active.length, picksRecorded: 0, sent: 0, byTenant: {} };

  for (const tenant of active) {
    const selections = selectForTenant(tenant.strategy, events, opportunities);
    const creds = tenantTelegram(tenant.telegramBotToken, tenant.telegramChannelId);
    let recorded = 0;
    let sent = 0;

    for (const { opportunity: op, event } of selections) {
      const pick = await upsertTenantPick({
        tenantId: tenant.id,
        eventId: event.id,
        market: op.market,
        bestPrice: op.bookmakerOdds,
        fairOdds: op.fairOdds,
        edgePct: op.edgePct,
        confidence: op.confidence,
        reasoning: op.reasoning,
      });
      recorded += 1;

      // Send only picks not yet pushed to this tenant's channel.
      if (creds && !pick.telegramSentAt) {
        const link = baseUrl ? `${baseUrl}/t/${tenant.slug}/analysis/${event.id}` : "";
        const ok = await sendTelegram(
          creds,
          pickMessage(event, op.market, op.bookmakerOdds, op.fairOdds, op.edgePct, op.confidence, link),
        );
        if (ok) {
          await markTenantPickSent(pick.id);
          sent += 1;
          await sleep(150);
        }
      }
    }

    summary.picksRecorded += recorded;
    summary.sent += sent;
    summary.byTenant[tenant.slug] = { recorded, sent };
  }

  return summary;
}
