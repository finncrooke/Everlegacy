import type { SupabaseClient } from "@supabase/supabase-js";
import { generateSlug } from "@/lib/qrcode";

/**
 * Returns the user's tribute page, creating an empty one if they don't have
 * one yet. Signup normally creates it immediately, but if Supabase email
 * confirmation is enabled there's a gap between signUp() and the first
 * authenticated request — this is the fallback that closes it, so a
 * confirmed-but-not-yet-initialized account never dead-ends.
 */
export async function ensureTributePage(supabase: SupabaseClient, userId: string) {
  const { data: existing } = await supabase
    .from("tribute_pages")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  let slug = generateSlug();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: clash } = await supabase.from("tribute_pages").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = generateSlug();
  }

  const { data: page, error } = await supabase
    .from("tribute_pages")
    .insert({ user_id: userId, slug })
    .select("*")
    .single();

  if (error || !page) {
    console.error("Failed to create tribute page", error);
    return null;
  }

  return page;
}
