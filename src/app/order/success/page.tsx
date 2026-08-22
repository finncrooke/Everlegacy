"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/client";

type OrderLookup = {
  orderId: string;
  claimToken: string;
  email: string;
  name: string;
  alreadyClaimed: boolean;
};

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [order, setOrder] = useState<OrderLookup | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLookupError("Missing checkout session.");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      const res = await fetch(`/api/orders/by-session?session_id=${encodeURIComponent(sessionId!)}`);
      if (cancelled) return;

      if (res.ok) {
        const data = await res.json();
        setOrder({
          orderId: data.orderId,
          claimToken: data.claimToken,
          email: data.email,
          name: data.name,
          alreadyClaimed: data.alreadyClaimed,
        });
        return;
      }

      if (attempts < 8) {
        setTimeout(poll, 1500); // webhook may take a moment to land
      } else {
        setLookupError("We're still confirming your payment. Please refresh in a moment.");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!order) return;
    setFormError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: order.email,
      password,
    });

    if (signUpError) {
      setFormError(signUpError.message);
      setSubmitting(false);
      return;
    }

    const claimRes = await fetch("/api/orders/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.orderId, claimToken: order.claimToken }),
    });

    if (!claimRes.ok) {
      const data = await claimRes.json().catch(() => ({}));
      setFormError(data.error ?? "We couldn't link your order. Please contact support.");
      setSubmitting(false);
      return;
    }

    router.push("/account");
  }

  if (lookupError) {
    return <p className="text-evergreen-900/80">{lookupError}</p>;
  }

  if (!order) {
    return <p className="text-evergreen-900/80">Confirming your payment…</p>;
  }

  return (
    <div>
      <p className="text-evergreen-900/80">
        Thank you, {order.name.split(" ")[0]}. Your plaque order is confirmed. Create a
        password now so you can log back in and build the tribute page whenever suits you.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
        <div>
          <label htmlFor="email" className="field-label">
            Email address
          </label>
          <input id="email" type="email" value={order.email} readOnly className="field-input bg-cream-100" />
        </div>
        <div>
          <label htmlFor="password" className="field-label">
            Choose a password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input"
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="mt-1.5 text-sm text-evergreen-900/70">
            At least 8 characters.
          </p>
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {formError}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
          {submitting ? "Creating your account…" : "Create account and start building"}
        </button>
      </form>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-evergreen-950">
      <SiteHeader />
      <section className="bg-cream-50 py-16">
        <div className="container-page max-w-xl">
          <p className="heading-caps text-evergreen-700">Payment received</p>
          <h1 className="mt-2 font-serif text-3xl text-evergreen-950">
            One last step — create your account
          </h1>
          <div className="mt-8">
            <Suspense fallback={<p>Loading…</p>}>
              <SuccessContent />
            </Suspense>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
