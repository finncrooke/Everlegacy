"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function SiteHeader() {
  // undefined = still checking; null = signed out; string = signed-in user id.
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b border-white/10 bg-evergreen-950">
      <div className="container-page flex h-20 items-center justify-between">
        <Link href="/" aria-label="Everlegacy home" className="flex items-center">
          <Image src="/brand/logo.png" alt="Everlegacy" width={168} height={94} className="h-9 w-auto" priority />
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-6">
          {userId ? (
            <Link href="/account" className="btn-primary text-sm px-6 py-3">
              My account
            </Link>
          ) : userId === null ? (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-cream-100/90 hover:text-gold-400 sm:inline-block"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn-primary text-sm px-6 py-3">
                Get started
              </Link>
            </>
          ) : (
            // Auth state still loading — reserve the button's space so the
            // header doesn't jump once we know whether it's "Get started"
            // or "My account".
            <span className="inline-block h-11 w-[7.5rem]" aria-hidden="true" />
          )}
        </nav>
      </div>
    </header>
  );
}
