"use client";

import { useState } from "react";
import { PLAQUE_TIERS, tierFor, type PlaqueQuantity } from "@/lib/pricing";

export function OrderForm({ pageId }: { pageId: string }) {
  const [quantity, setQuantity] = useState<PlaqueQuantity>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), quantity, pageId };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Something went wrong starting checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-8" noValidate>
      <fieldset>
        <legend className="heading-caps text-evergreen-700 mb-3">How many plaques?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLAQUE_TIERS.map((tier) => {
            const perPlaque = tier.totalGBP / tier.quantity;
            const selected = quantity === tier.quantity;
            return (
              <label
                key={tier.quantity}
                className={`relative flex min-h-[44px] cursor-pointer flex-col rounded-xl border-2 p-4 transition-colors ${
                  selected
                    ? "border-gold-500 bg-gold-500/10"
                    : "border-evergreen-900/15 bg-white hover:border-evergreen-900/30"
                }`}
              >
                <input
                  type="radio"
                  name="quantity-picker"
                  value={tier.quantity}
                  checked={selected}
                  onChange={() => setQuantity(tier.quantity)}
                  className="sr-only"
                />
                {tier.quantity > 1 && (
                  <span className="mb-1 self-start rounded-full bg-evergreen-950 px-2.5 py-0.5 text-xs font-semibold text-gold-400">
                    Save £{tier.quantity * PLAQUE_TIERS[0].totalGBP - tier.totalGBP}
                  </span>
                )}
                <span className="font-serif text-lg text-evergreen-950">
                  {tier.quantity} {tier.quantity === 1 ? "plaque" : "plaques"}
                </span>
                <span className="mt-1 text-2xl font-semibold text-evergreen-950">£{tier.totalGBP}</span>
                <span className="text-sm text-evergreen-900/60">£{perPlaque.toFixed(2)} each</span>
              </label>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-evergreen-900/70">
          Extra plaques link to the same tribute page — handy as a spare, or for another family
          member to keep at a different headstone visit.
        </p>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="heading-caps text-evergreen-700">Shipping address</legend>
        <div>
          <label htmlFor="name" className="field-label">
            Full name
          </label>
          <input id="name" name="name" type="text" required autoComplete="name" className="field-input" />
        </div>
        <div>
          <label htmlFor="address1" className="field-label">
            Address line 1
          </label>
          <input
            id="address1"
            name="address1"
            type="text"
            required
            autoComplete="address-line1"
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="address2" className="field-label">
            Address line 2 (optional)
          </label>
          <input
            id="address2"
            name="address2"
            type="text"
            autoComplete="address-line2"
            className="field-input"
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className="field-label">
              Town or city
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              autoComplete="address-level2"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="postcode" className="field-label">
              Postcode
            </label>
            <input
              id="postcode"
              name="postcode"
              type="text"
              required
              autoComplete="postal-code"
              className="field-input"
            />
          </div>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "Redirecting to payment…" : `Continue to payment — £${tierFor(quantity).totalGBP}`}
      </button>
      <p className="text-sm text-evergreen-900/70">
        You&apos;ll be taken to Stripe&apos;s secure checkout to complete payment.
      </p>
    </form>
  );
}
