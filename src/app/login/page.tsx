"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("We couldn't sign you in. Check your email and password and try again.");
      setLoading(false);
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-evergreen-950">
      <SiteHeader />
      <section className="bg-cream-50 py-16">
        <div className="container-page max-w-md">
          <p className="heading-caps text-evergreen-700">Account</p>
          <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Log in</h1>
          <p className="mt-2 text-evergreen-900/75">
            Log back in to edit the tribute page or check your order status.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
            <div>
              <label htmlFor="email" className="field-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
              {loading ? "Signing in…" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-evergreen-900/70">
            Haven't ordered yet?{" "}
            <a href="/order" className="font-medium text-evergreen-800 underline">
              Order a plaque
            </a>
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
