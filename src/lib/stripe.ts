import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export { PLAQUE_TIERS, tierFor } from "@/lib/pricing";
export type { PlaqueQuantity } from "@/lib/pricing";
