import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { sendOrderStatusEmail } from "@/lib/email";

const VALID_STATUSES = ["processing", "shipped", "delivered"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { orderId, status } = await request.json();
  if (!orderId || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: order, error } = await admin
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select("customer_email, shipping_name")
    .maybeSingle();

  if (error) {
    console.error("Failed to update order status", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  if (order?.customer_email) {
    // Awaited — see the Stripe webhook for why fire-and-forget doesn't work
    // reliably on Vercel's serverless functions.
    await sendOrderStatusEmail({ to: order.customer_email, name: order.shipping_name ?? "there", status }).catch(
      (err) => console.error("Failed to send order status email", err)
    );
  }

  return NextResponse.json({ ok: true });
}
