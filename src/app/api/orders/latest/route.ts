import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the signed-in customer's most recent order, or null if the
 * webhook hasn't landed yet. Used by the order confirmation page to poll
 * for payment completion without ever needing the Stripe session id.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, shipping_name, plaque_quantity, amount_total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ order: order ?? null });
}
