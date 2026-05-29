// Telegram Bot API sender. Enabled when both a bot token and channel id are set.
// Posts to a channel the bot administers. Never throws — returns success boolean.

export const telegramEnabled =
  !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHANNEL_ID;

const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL = () => process.env.TELEGRAM_CHANNEL_ID!;

export async function sendTelegramMessage(html: string): Promise<boolean> {
  if (!telegramEnabled) return false;
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
    return res.ok;
  } catch {
    return false;
  }
}
