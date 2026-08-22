"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

type Order = {
  id: string;
  shipping_name: string;
  plaque_quantity: number;
  amount_total: number;
};

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const seenAt = Date.now();

    async function poll() {
      attempts += 1;
      const res = await fetch("/api/orders/latest");
      if (cancelled) return;

      if (res.ok) {
        const data = await res.json();
        // Wait for an order created after this page loaded, so a repeat
        // customer doesn't briefly see their previous order.
        if (data.order && Date.parse(data.order.created_at) >= seenAt - 60_000) {
          setOrder(data.order);
          return;
        }
      }

      if (attempts < 10) {
        setTimeout(poll, 1500); // webhook may take a moment to land
      } else {
        setError("We're still confirming your payment. This page will update automatically — feel free to check your account in a minute.");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-evergreen-950">
      <SiteHeader />
      <section className="bg-cream-50 py-16">
        <div className="container-page max-w-xl">
          <p className="heading-caps text-evergreen-700">Payment received</p>
          <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Your plaque is on its way</h1>

          <div className="mt-8">
            {order ? (
              <>
                <p className="text-evergreen-900/80">
                  Thank you, {order.shipping_name.split(" ")[0]}. We&apos;ve received your order for{" "}
                  {order.plaque_quantity} {order.plaque_quantity === 1 ? "plaque" : "plaques"}. We&apos;ll
                  engrave it with the QR code for your tribute page and post it to you — you can track
                  the status from your account.
                </p>
                <a href="/account" className="btn-primary mt-8 inline-flex">
                  Go to your account
                </a>
              </>
            ) : error ? (
              <p className="text-evergreen-900/80">{error}</p>
            ) : (
              <p className="text-evergreen-900/80">Confirming your payment…</p>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
