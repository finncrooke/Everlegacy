import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/qrcode";

/**
 * Links a freshly paid order to the account the customer just created, and
 * provisions their (empty) tribute page. Requires an authenticated session
 * (the customer must have just signed up or logged in) plus the order's
 * claim token, which only the success page — reached via the Stripe
 * session id — ever sees.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { orderId, claimToken } = await request.json();
  if (!orderId || !claimToken) {
    return NextResponse.json({ error: "Missing order details" }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, customer_email, user_id, tribute_page_id, claim_token")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.claim_token !== claimToken) {
    return NextResponse.json({ error: "Invalid claim token" }, { status: 403 });
  }

  if (order.user_id && order.user_id !== user.id) {
    return NextResponse.json({ error: "This order is already linked to another account" }, { status: 409 });
  }

  // Already claimed by this same user — just return the existing page.
  if (order.tribute_page_id) {
    const { data: existingPage } = await admin
      .from("tribute_pages")
      .select("slug")
      .eq("id", order.tribute_page_id)
      .maybeSingle();
    return NextResponse.json({ slug: existingPage?.slug ?? null });
  }

  let slug = generateSlug();
  // Vanishingly unlikely, but guard against a slug collision anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: clash } = await admin.from("tribute_pages").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = generateSlug();
  }

  const { data: page, error: pageError } = await admin
    .from("tribute_pages")
    .insert({ user_id: user.id, order_id: order.id, slug })
    .select("id, slug")
    .single();

  if (pageError || !page) {
    console.error("Failed to create tribute page", pageError);
    return NextResponse.json({ error: "Failed to set up your tribute page" }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("orders")
    .update({ user_id: user.id, tribute_page_id: page.id })
    .eq("id", order.id);

  if (updateError) {
    console.error("Failed to link order to account", updateError);
    return NextResponse.json({ error: "Failed to link your order" }, { status: 500 });
  }

  return NextResponse.json({ slug: page.slug });
}
