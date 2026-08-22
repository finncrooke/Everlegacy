import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";
import { sendTelegramMessage } from "@/lib/telegram";

/**
 * Sends the welcome email + owner Telegram notification for a freshly
 * created account. Called once right after signup — either immediately
 * (if Supabase handed back a session straight away) or after the customer
 * confirms their email and lands back on /account?welcome=1.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await sendWelcomeEmail(user.email!).catch((err) => console.error("Failed to send welcome email", err));
  await sendTelegramMessage(`🆕 New Everlegacy account: ${user.email}`).catch((err) =>
    console.error("Failed to send Telegram notification", err)
  );

  return NextResponse.json({ ok: true });
}
