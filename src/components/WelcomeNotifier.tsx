"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * If the account was just confirmed via email link (redirected here as
 * /account?welcome=1), fires the welcome email + owner notification once,
 * then strips the query param so refreshing doesn't repeat it.
 */
export function WelcomeNotifier() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firedRef = useRef(false);

  useEffect(() => {
    if (searchParams.get("welcome") !== "1" || firedRef.current) return;
    firedRef.current = true;
    fetch("/api/account/welcome", { method: "POST" }).catch(() => {});
    router.replace("/account");
  }, [searchParams, router]);

  return null;
}
