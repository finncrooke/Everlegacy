import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTributePage } from "@/lib/tribute";

/**
 * Creates a new tribute page for the signed-in customer — the first step
 * of the tribute wizard. An account can build more than one page (e.g. for
 * different family members), so this always creates a fresh row rather
 * than reusing an existing one.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { fullName } = await request.json();
  if (!fullName || !String(fullName).trim()) {
    return NextResponse.json({ error: "A name is needed to start the page." }, { status: 400 });
  }

  const page = await createTributePage(supabase, user.id, String(fullName).trim());
  if (!page) {
    return NextResponse.json({ error: "Failed to create the tribute page" }, { status: 500 });
  }

  return NextResponse.json({ id: page.id, slug: page.slug });
}
