import { NextResponse } from "next/server";
import { stripe, PLAQUE_PRICE_GBP } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, name, address1, address2, city, postcode } = body ?? {};

  if (!email || !name || !address1 || !city || !postcode) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(PLAQUE_PRICE_GBP * 100),
            product_data: {
              name: "Everlegacy memorial QR plaque",
              description: "Weatherproof engraved QR plaque and hosted tribute page.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        shipping_name: name,
        shipping_address_line1: address1,
        shipping_address_line2: address2 ?? "",
        shipping_city: city,
        shipping_postcode: postcode,
      },
      success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/order`,
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
