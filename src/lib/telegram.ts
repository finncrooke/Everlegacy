/**
 * Sends a message to the business owner's Telegram via a bot. Optional —
 * skipped (logged) if TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID aren't set.
 */
export async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set — skipping Telegram notification");
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });

  if (!res.ok) {
    console.error("Telegram notification failed", await res.text().catch(() => res.statusText));
  }
}
