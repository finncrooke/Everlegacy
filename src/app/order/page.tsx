"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const PRICE = process.env.NEXT_PUBLIC_PLAQUE_PRICE_GBP ?? "79";

export default function OrderPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

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
    <div className="min-h-screen bg-evergreen-950">
      <SiteHeader />
      <section className="bg-cream-50 py-16">
        <div className="container-page max-w-2xl">
          <p className="heading-caps text-evergreen-700">Order</p>
          <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Order your memorial plaque</h1>
          <p className="mt-2 text-evergreen-900/75">
            One weatherproof QR plaque, £{PRICE}. You'll create your account and start
            building the tribute page right after payment.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
            <fieldset className="space-y-6">
              <legend className="heading-caps text-evergreen-700">Contact details</legend>
              <div>
                <label htmlFor="email" className="field-label">
                  Your email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="field-input"
                />
              </div>
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
              {loading ? "Redirecting to payment…" : `Continue to payment — £${PRICE}`}
            </button>
            <p className="text-sm text-evergreen-900/60">
              You'll be taken to Stripe's secure checkout to complete payment.
            </p>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
