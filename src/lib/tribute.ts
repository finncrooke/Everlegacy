import type { SupabaseClient } from "@supabase/supabase-js";
import { generateSlug } from "@/lib/qrcode";

/**
 * One account can build several tribute pages (e.g. for different family
 * members), so there's no single "the user's page" anymore — every lookup
 * here is explicit about which page, to avoid ever mixing two up.
 */

/** All tribute pages belonging to a user, most recently created first. */
export async function listTributePages(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("tribute_pages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** A single tribute page, only if it belongs to this user. */
export async function getOwnedTributePage(supabase: SupabaseClient, userId: string, pageId: string) {
  const { data } = await supabase
    .from("tribute_pages")
    .select("*")
    .eq("id", pageId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

/** Creates a new (additional) tribute page for this user. */
export async function createTributePage(supabase: SupabaseClient, userId: string, fullName: string) {
  let slug = generateSlug();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: clash } = await supabase.from("tribute_pages").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = generateSlug();
  }

  const { data: page, error } = await supabase
    .from("tribute_pages")
    .insert({ user_id: userId, slug, full_name: fullName })
    .select("*")
    .single();

  if (error || !page) {
    console.error("Failed to create tribute page", error);
    return null;
  }

  return page;
}
