import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { publicUrlForKey } from "@/lib/r2";

async function getPage(slug: string) {
  const supabase = await createClient();
  const { data: page } = await supabase.from("tribute_pages").select("*").eq("slug", slug).maybeSingle();
  if (!page) return null;

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

  return { page, photos: photos ?? [], timeline: timeline ?? [] };
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getPage(params.slug);
  if (!data) return {};
  const { page } = data;
  return {
    title: page.full_name || "A tribute page",
    description: page.epitaph || `A tribute page remembering ${page.full_name}.`,
    robots:
      page.published && page.visibility === "public" ? undefined : { index: false, follow: false },
  };
}

export default async function TributePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { preview?: string };
}) {
  const data = await getPage(params.slug);
  if (!data) notFound();

  const { page, photos, timeline } = data;

  // The page only goes live once a plaque for it has been paid for — before
  // that, nobody scanning a guessed link (or the not-yet-live QR code)
  // should be able to see it. The owner's own "Preview page" link still
  // works via ?preview=1 so they can check it before ordering.
  if (!page.published && searchParams.preview !== "1") {
    notFound();
  }
  const dob = formatDate(page.date_of_birth);
  const dop = formatDate(page.date_of_passing);
  const coverPhoto = photos.find((p) => p.is_cover) ?? photos[0];
  const galleryPhotos = photos.filter((p) => p.id !== coverPhoto?.id);

  return (
    <div className="min-h-screen bg-cream-50">
      <main className="mx-auto max-w-2xl">
        {coverPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={publicUrlForKey(coverPhoto.storage_path)}
            alt={coverPhoto.alt_text || `Photo of ${page.full_name}`}
            className="h-72 w-full object-cover sm:h-96"
          />
        )}

        <div className="px-6 py-10 text-center sm:px-10">
          <h1 className="font-serif text-3xl text-evergreen-950 sm:text-4xl">{page.full_name}</h1>
          {(dob || dop) && (
            <p className="mt-2 text-evergreen-900/70">
              {dob ?? "—"} {(dob || dop) && "–"} {dop ?? "—"}
            </p>
          )}
          {page.epitaph && (
            <p className="mx-auto mt-6 max-w-md font-serif text-xl italic text-evergreen-900/85">
              &ldquo;{page.epitaph}&rdquo;
            </p>
          )}

          {page.story && (
            <div className="mx-auto mt-10 max-w-xl text-left">
              <p className="whitespace-pre-line leading-relaxed text-evergreen-900/85">{page.story}</p>
            </div>
          )}

          {galleryPhotos.length > 0 && (
            <div className="mt-10">
              <h2 className="heading-caps text-evergreen-700">Photos</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryPhotos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.id}
                    src={publicUrlForKey(photo.storage_path)}
                    alt={photo.alt_text || `Photo of ${page.full_name}`}
                    loading="lazy"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          {timeline.length > 0 && (
            <div className="mt-12 text-left">
              <h2 className="heading-caps text-evergreen-700 text-center sm:text-left">Their story, in time</h2>
              <ol className="mt-6 space-y-6 border-l-2 border-gold-500/50 pl-6">
                {timeline.map((entry) => (
                  <li key={entry.id}>
                    <p className="text-sm font-semibold text-gold-700">{entry.entry_date}</p>
                    <p className="font-serif text-lg text-evergreen-950">{entry.title}</p>
                    {entry.description && (
                      <p className="mt-1 text-evergreen-900/80">{entry.description}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-evergreen-900/10 py-8 text-center">
        <Link href="/" className="text-sm text-evergreen-900/70 underline hover:text-evergreen-900">
          Create your own tribute page
        </Link>
      </footer>
    </div>
  );
}
