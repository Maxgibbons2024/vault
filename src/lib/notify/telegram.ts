// Telegram Bot API sender. Enabled when both a bot token and channel id are set.
// Posts to a channel the bot administers. Never throws — returns success boolean.

export const telegramEnabled =
  !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHANNEL_ID;

const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL = () => process.env.TELEGRAM_CHANNEL_ID!;

// Send a message; returns the new message id (or null on failure / disabled).
export async function sendTelegram(html: string): Promise<number | null> {
  if (!telegramEnabled) return null;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TOKEN()}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHANNEL(),
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

export async function sendTelegramMessage(html: string): Promise<boolean> {
  return (await sendTelegram(html)) !== null;
}

export async function pinTelegram(messageId: number): Promise<boolean> {
  if (!telegramEnabled) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN()}/pinChatMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHANNEL(),
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

// Pinned glossary explaining each field in an alert.
export const LEGEND_HTML = `📌 <b>How to read VaultBets AI alerts</b>

Each alert flags a possible <b>value bet</b> — where the price you can get looks better than the “true” price.

⚽ <b>Match &amp; competition</b> — the teams/players and start time.
🎯 <b>Market</b> — the specific bet (e.g. Over 2.5 Goals, PSG to win).
💰 <b>Best</b> — the best decimal odds currently available across bookmakers.
⚖️ <b>Fair</b> — our no-vig fair odds: we remove each bookmaker’s margin and average across many books to estimate the true price.
📈 <b>Edge</b> — how much better Best is than Fair.  Edge = (Best ÷ Fair − 1). e.g. Best 2.05, Fair 1.75 → <b>+17%</b>. Positive edge = potential value. It measures <b>value, not win probability</b>.
🔢 <b>Conf</b> — confidence 0–10: higher = stronger, steadier signal (bigger edge, more books agreeing).

We only post edges of <b>5%+</b>. Bigger edge = bigger gap vs the market, but usually higher variance too.

⚠️ <i>Educational analysis only. Nothing here is financial or betting advice. 18+. Please gamble responsibly — BeGambleAware.org</i>`;

export async function postAndPinLegend(): Promise<boolean> {
  const id = await sendTelegram(LEGEND_HTML);
  if (id == null) return false;
  await pinTelegram(id);
  return true;
}
