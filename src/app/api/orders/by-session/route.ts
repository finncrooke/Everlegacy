import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Looks up the order created by the Stripe webhook for a given checkout
 * session, so the success page can prefill the account-creation form.
 * The Stripe session id itself is unguessable, so this is safe to expose
 * without auth — it only ever returns the order tied to that one session.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, claim_token, customer_email, shipping_name, user_id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (error) {
    console.error("Failed to look up order by session", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  if (!order) {
    // The webhook may not have landed yet — ask the client to retry shortly.
    return NextResponse.json({ error: "Order not found yet" }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    claimToken: order.claim_token,
    email: order.customer_email,
    name: order.shipping_name,
    alreadyClaimed: Boolean(order.user_id),
  });
}
