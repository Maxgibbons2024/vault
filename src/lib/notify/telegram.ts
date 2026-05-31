// Telegram Bot API sender — now per-tenant. Each tenant supplies its own bot
// token + channel id. Never throws; returns success / message id.

export interface TelegramCreds {
  botToken: string;
  channelId: string;
}

export function tenantTelegram(
  botToken?: string | null,
  channelId?: string | null,
): TelegramCreds | null {
  return botToken && channelId ? { botToken, channelId } : null;
}

export async function sendTelegram(
  creds: TelegramCreds,
  html: string,
): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${creds.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: creds.channelId,
          text: html,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        cache: "no-store",
      },
    );
    const data = await res.json();
    return data?.ok ? data.result.message_id : null;
  } catch {
    return null;
  }
}

export async function sendTelegramMessage(
  creds: TelegramCreds,
  html: string,
): Promise<boolean> {
  return (await sendTelegram(creds, html)) !== null;
}

export async function pinTelegram(creds: TelegramCreds, messageId: number): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${creds.botToken}/pinChatMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: creds.channelId,
        message_id: messageId,
        disable_notification: true,
      }),
      cache: "no-store",
    });
    return (await res.json())?.ok ?? false;
  } catch {
    return false;
  }
}

// Branded glossary, parameterised by tenant name.
export function legendHtml(brandName: string) {
  return `📌 <b>How to read ${escapeHtml(brandName)} alerts</b>

Each alert flags a possible <b>value bet</b> — where the price you can get looks better than the “true” price.

⚽ <b>Match &amp; competition</b> — the teams/players and start time.
🎯 <b>Market</b> — the specific bet (e.g. Over 2.5 Goals, PSG to win).
💰 <b>Best</b> — the best decimal odds currently available across bookmakers.
⚖️ <b>Fair</b> — our sharp-book no-vig fair odds (the true price once margin is stripped).
📈 <b>Edge</b> — how much better Best is than Fair. Positive edge = potential value. It measures <b>value, not win probability</b>.
🔢 <b>Conf</b> — confidence 0–10: higher = stronger, steadier signal.

⚠️ <i>Educational analysis only. Nothing here is financial or betting advice. 18+. Please gamble responsibly — BeGambleAware.org</i>`;
}

export async function postAndPinLegend(creds: TelegramCreds, brandName: string): Promise<boolean> {
  const id = await sendTelegram(creds, legendHtml(brandName));
  if (id == null) return false;
  await pinTelegram(creds, id);
  return true;
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
