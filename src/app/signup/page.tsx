"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // With email confirmation enabled, signUp() creates the account but
    // doesn't return an active session — the customer has to click the link
    // in the confirmation email first, which lands them on /account/edit
    // (that page creates the tribute page itself if it's missing).
    if (!data.session) {
      setNeedsConfirmation(true);
      setLoading(false);
      return;
    }

    const initRes = await fetch("/api/tribute/init", { method: "POST" });
    if (!initRes.ok) {
      setError("Your account was created, but we couldn't set up your tribute page. Please try logging in.");
      setLoading(false);
      return;
    }

    router.push("/account/edit");
    router.refresh();
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-evergreen-950">
        <SiteHeader />
        <section className="bg-cream-50 py-16">
          <div className="container-page max-w-md">
            <p className="heading-caps text-evergreen-700">Almost there</p>
            <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Check your email</h1>
            <p className="mt-4 text-evergreen-900/75">
              We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to finish
              creating your account and start building the tribute page.
            </p>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-evergreen-950">
      <SiteHeader />
      <section className="bg-cream-50 py-16">
        <div className="container-page max-w-md">
          <p className="heading-caps text-evergreen-700">Get started</p>
          <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Create your account</h1>
          <p className="mt-2 text-evergreen-900/75">
            Free to start. Build the tribute page first — you only pay when you order the
            physical plaque.
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

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
              {loading ? "Creating your account…" : "Create account and start building"}
            </button>
          </form>

          <p className="mt-6 text-sm text-evergreen-900/70">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-evergreen-800 underline">
              Log in
            </a>
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
