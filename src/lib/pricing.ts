/**
 * Plaque bundle pricing, shared between server routes and client components.
 * Kept separate from lib/stripe.ts so client components can import pricing
 * without pulling in the Stripe SDK (which needs a server-only secret key).
 *
 * Customers build their tribute page first, then order physical plaques for
 * it — most want more than one (a spare, one per family member's visit, a
 * gift), so bundles are priced to make 2 or 3 the obvious choice over 1.
 */
export const PLAQUE_TIERS = [
  { quantity: 1, totalGBP: 49 },
  { quantity: 2, totalGBP: 64 },
  { quantity: 3, totalGBP: 74 },
] as const;

export type PlaqueQuantity = (typeof PLAQUE_TIERS)[number]["quantity"];

export function tierFor(quantity: number) {
  return PLAQUE_TIERS.find((t) => t.quantity === quantity) ?? PLAQUE_TIERS[0];
}
