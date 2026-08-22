import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PhotoInput = { storagePath: string; isCover: boolean; altText?: string };
type TimelineInput = { entryDate: string; title: string; description?: string };

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json();
  const {
    pageId,
    fullName,
    dateOfBirth,
    dateOfPassing,
    epitaph,
    story,
    visibility,
    published,
    photos,
    timeline,
  }: {
    pageId: string;
    fullName: string;
    dateOfBirth: string | null;
    dateOfPassing: string | null;
    epitaph: string | null;
    story: string | null;
    visibility: "public" | "unlisted";
    published: boolean;
    photos: PhotoInput[];
    timeline: TimelineInput[];
  } = body;

  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }

  // RLS ensures this only succeeds for the page's owner.
  const coverPhoto = photos?.find((p) => p.isCover) ?? photos?.[0];

  const { data: existing } = await supabase
    .from("tribute_pages")
    .select("first_saved_at")
    .eq("id", pageId)
    .maybeSingle();
  const isFirstSave = !existing?.first_saved_at;

  const { error: updateError } = await supabase
    .from("tribute_pages")
    .update({
      full_name: fullName ?? "",
      date_of_birth: dateOfBirth || null,
      date_of_passing: dateOfPassing || null,
      epitaph: epitaph || null,
      story: story || null,
      visibility: visibility === "public" ? "public" : "unlisted",
      published: Boolean(published),
      cover_photo_path: coverPhoto?.storagePath ?? null,
      ...(isFirstSave ? { first_saved_at: new Date().toISOString() } : {}),
    })
    .eq("id", pageId);

  if (updateError) {
    console.error("Failed to save tribute page", updateError);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  // Replace child rows wholesale — simple and fine at this scale.
  await supabase.from("tribute_photos").delete().eq("tribute_page_id", pageId);
  if (photos?.length) {
    const { error: photosError } = await supabase.from("tribute_photos").insert(
      photos.map((p, i) => ({
        tribute_page_id: pageId,
        storage_path: p.storagePath,
        is_cover: Boolean(p.isCover),
        alt_text: p.altText ?? null,
        position: i,
      }))
    );
    if (photosError) console.error("Failed to save photos", photosError);
  }

  await supabase.from("tribute_timeline_entries").delete().eq("tribute_page_id", pageId);
  if (timeline?.length) {
    const { error: timelineError } = await supabase.from("tribute_timeline_entries").insert(
      timeline.map((t, i) => ({
        tribute_page_id: pageId,
        entry_date: t.entryDate,
        title: t.title,
        description: t.description ?? null,
        position: i,
      }))
    );
    if (timelineError) console.error("Failed to save timeline", timelineError);
  }

  return NextResponse.json({ ok: true, firstSave: isFirstSave });
}
