import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureTributePage } from "@/lib/tribute";

/**
 * Creates the (empty) tribute page for a freshly signed-up customer, or
 * returns their existing one if they already have it. Called right after
 * signup — customers build their page before ordering a plaque for it.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const page = await ensureTributePage(supabase, user.id, user.email);
  if (!page) {
    return NextResponse.json({ error: "Failed to set up your tribute page" }, { status: 500 });
  }

  return NextResponse.json({ slug: page.slug });
}
