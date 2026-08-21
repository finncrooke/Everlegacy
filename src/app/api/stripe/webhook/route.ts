import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
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
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = createServiceRoleClient();

    const { error } = await supabase.from("orders").insert({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      customer_email: session.customer_email ?? session.customer_details?.email ?? "",
      shipping_name: session.metadata?.shipping_name ?? "",
      shipping_address_line1: session.metadata?.shipping_address_line1 ?? "",
      shipping_address_line2: session.metadata?.shipping_address_line2 || null,
      shipping_city: session.metadata?.shipping_city ?? "",
      shipping_postcode: session.metadata?.shipping_postcode ?? "",
      amount_total: session.amount_total ?? 0,
      currency: session.currency ?? "gbp",
      status: "processing",
    });

    if (error) {
      // Unique violation on stripe_checkout_session_id means we've already
      // recorded this order (Stripe retries webhooks) — safe to ignore.
      if (error.code !== "23505") {
        console.error("Failed to record order from webhook", error);
        return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
