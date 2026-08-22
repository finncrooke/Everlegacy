import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TributeEditor } from "@/components/TributeEditor";
import { publicUrlForKey } from "@/lib/r2";
import { getOwnedTributePage, listTributePages } from "@/lib/tribute";
import { possessive } from "@/lib/text";

export default async function EditTributePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let page;
  if (searchParams.page) {
    page = await getOwnedTributePage(supabase, user.id, searchParams.page);
    if (!page) redirect("/account");
  } else {
    // No page specified — fall back sensibly depending on how many the
    // account has, rather than guessing which one they meant.
    const pages = await listTributePages(supabase, user.id);
    if (pages.length === 0) redirect("/account/new");
    if (pages.length > 1) redirect("/account");
    page = pages[0];
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
          <h1 className="mt-2 font-serif text-3xl text-evergreen-950">
            {page.full_name ? `Editing ${possessive(page.full_name)} page` : "Build their tribute page"}
          </h1>
          <p className="mt-2 text-evergreen-900/75">
            Everything saves automatically as you go. When you&apos;re ready, continue to order a
            plaque for it.
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
