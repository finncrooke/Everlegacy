import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

/** The single plaque product for v1 — one option, one clear price. */
export const PLAQUE_PRICE_GBP = Number(process.env.NEXT_PUBLIC_PLAQUE_PRICE_GBP ?? 79);
