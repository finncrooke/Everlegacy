import { NextResponse } from "next/server";
import { stripe, tierFor } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const body = await request.json();
  const { name, address1, address2, city, postcode, quantity, pageId } = body ?? {};

  if (!pageId) {
    return NextResponse.json({ error: "Missing which tribute page this order is for." }, { status: 400 });
  }

  // Verify this page actually belongs to the signed-in customer — never
  // trust a pageId from the client without checking, so an order can never
  // end up linked to someone else's (or the wrong) tribute page.
  const { data: page } = await supabase
    .from("tribute_pages")
    .select("id")
    .eq("id", pageId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!page) {
    return NextResponse.json(
      { error: "We couldn't find that tribute page on your account." },
      { status: 400 }
    );
  }

  if (!name || !address1 || !city || !postcode) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  const tier = tierFor(Number(quantity) || 1);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(tier.totalGBP * 100),
            product_data: {
              name:
                tier.quantity === 1
                  ? "Everlegacy memorial QR plaque"
                  : `Everlegacy memorial QR plaques (${tier.quantity})`,
              description: "Weatherproof engraved QR plaque(s) linking to your tribute page.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        tribute_page_id: page.id,
        plaque_quantity: String(tier.quantity),
        shipping_name: name,
        shipping_address_line1: address1,
        shipping_address_line2: address2 ?? "",
        shipping_city: city,
        shipping_postcode: postcode,
      },
      success_url: `${siteUrl}/order/success`,
      cancel_url: `${siteUrl}/order`,
      // Shows a "discount code" field on the Stripe Checkout page. Codes
      // themselves are created in the Stripe dashboard, not in this app.
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session creation failed", err);
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again." },
      { status: 500 }
    );
  }
}
