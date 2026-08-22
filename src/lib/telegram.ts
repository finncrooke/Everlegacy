/**
 * Sends a message to the business owner's Telegram via a bot. Optional —
 * skipped (logged) if TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID aren't set.
 *
 * Callers must `await` this (never fire-and-forget with .catch()) — on
 * Vercel a serverless function can be frozen the instant the response is
 * sent, killing any request still in flight that wasn't awaited. That was
 * the actual reason notifications were going missing.
 */
export async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set — skipping Telegram notification");
    return;
  }

  const timestamp = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  });

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: `${text}\n<i>${timestamp}</i>`, parse_mode: "HTML" }),
    });

    if (!res.ok) {
      console.error("Telegram notification failed", await res.text().catch(() => res.statusText));
    }
  } catch (err) {
    console.error("Telegram notification threw", err);
  }
}
