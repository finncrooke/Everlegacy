import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TributeEditor } from "@/components/TributeEditor";
import { publicUrlForKey } from "@/lib/r2";

export default async function EditTributePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: page } = await supabase
    .from("tribute_pages")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!page) {
    redirect("/account");
  }

  const { data: photos } = await supabase
    .from("tribute_photos")
    .select("*")
    .eq("tribute_page_id", page.id)
    .order("position", { ascending: true });

  const { data: timeline } = await supabase
    .from("tribute_timeline_entries")
    .select("*")
    .eq("tribute_page_id", page.id)
    .order("position", { ascending: true });

  return (
    <div className="min-h-screen bg-evergreen-950">
      <SiteHeader />
      <section className="bg-cream-50 py-16">
        <div className="container-page max-w-3xl">
          <p className="heading-caps text-evergreen-700">Tribute page editor</p>
          <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Build their tribute page</h1>
          <p className="mt-2 text-evergreen-900/75">
            Add as much or as little as feels right. You can come back and update this at any time.
          </p>

          <TributeEditor
            page={{
              id: page.id,
              slug: page.slug,
              fullName: page.full_name ?? "",
              dateOfBirth: page.date_of_birth ?? "",
              dateOfPassing: page.date_of_passing ?? "",
              epitaph: page.epitaph ?? "",
              story: page.story ?? "",
              visibility: page.visibility,
              published: page.published,
            }}
            initialPhotos={(photos ?? []).map((p) => ({
              id: p.id,
              storagePath: p.storage_path,
              publicUrl: publicUrlForKey(p.storage_path),
              isCover: p.is_cover,
              altText: p.alt_text ?? "",
            }))}
            initialTimeline={(timeline ?? []).map((t) => ({
              id: t.id,
              entryDate: t.entry_date,
              title: t.title,
              description: t.description ?? "",
            }))}
          />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
