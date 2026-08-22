import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { sendTelegramMessage } from "@/lib/telegram";
import { tributeUrl } from "@/lib/qrcode";
import Stripe from "stripe";

// Stripe needs the raw request body to verify the webhook signature.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    // A live-mode event verified against a test-mode secret (or vice versa)
    // lands here — check STRIPE_WEBHOOK_SECRET matches the webhook endpoint
    // for the mode the event actually came from.
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }
  } catch (err) {
    // Any unhandled exception previously left the response hanging with no
    // detail — Stripe marks the delivery "failed" and the customer's
    // success page polls forever with no way to tell what went wrong.
    console.error("Stripe webhook handler threw", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("orders").insert({
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    customer_email: session.customer_email ?? session.customer_details?.email ?? "",
    shipping_name: session.metadata?.shipping_name ?? "",
    shipping_address_line1: session.metadata?.shipping_address_line1 ?? "",
    shipping_address_line2: session.metadata?.shipping_address_line2 || null,
    shipping_city: session.metadata?.shipping_city ?? "",
    shipping_postcode: session.metadata?.shipping_postcode ?? "",
    plaque_quantity: Number(session.metadata?.plaque_quantity) || 1,
    amount_total: session.amount_total ?? 0,
    currency: session.currency ?? "gbp",
    status: "processing",
    // Checkout only ever runs for a logged-in customer ordering a plaque
    // for their own tribute page, so this metadata is trusted — set both
    // straight away, no separate "claim" step needed.
    user_id: session.metadata?.user_id || null,
    tribute_page_id: session.metadata?.tribute_page_id || null,
  });

  if (error) {
    // Unique violation on stripe_checkout_session_id means we've already
    // recorded this order (Stripe retries webhooks) — safe to ignore, and
    // don't send a second confirmation email for it.
    if (error.code === "23505") return;
    throw new Error(`Failed to record order from webhook: ${error.message}`);
  }

  const email = session.customer_email ?? session.customer_details?.email;
  const pageId = session.metadata?.tribute_page_id;
  let pageSlug: string | null = null;
  if (pageId) {
    // The page only goes live once a plaque for it is actually paid for —
    // nobody can see it, and the QR code doesn't point anywhere real, until
    // this fires. Publishing here (not when the customer clicks "continue
    // to order") is what makes that true even for a $0 discount-code order.
    const { data: page } = await supabase
      .from("tribute_pages")
      .update({ published: true })
      .eq("id", pageId)
      .select("slug")
      .maybeSingle();
    pageSlug = page?.slug ?? null;
  }

  // Awaited (not fire-and-forget) — on Vercel, a serverless function can be
  // frozen the instant this handler returns, killing any unawaited request
  // still in flight. That was the actual cause of missing notifications.
  if (email) {
    await sendOrderConfirmationEmail({
      to: email,
      name: session.metadata?.shipping_name ?? "there",
      quantity: Number(session.metadata?.plaque_quantity) || 1,
      tributeUrl: pageSlug ? tributeUrl(pageSlug) : null,
    }).catch((err) => console.error("Failed to send order confirmation email", err));
  }

  await sendTelegramMessage(
    `💰 New Everlegacy order: ${session.metadata?.plaque_quantity ?? 1} plaque(s) from ${
      session.metadata?.shipping_name ?? email ?? "unknown"
    }`
  ).catch((err) => console.error("Failed to send Telegram order notification", err));
}
