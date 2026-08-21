import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPresignedUploadUrl, publicUrlForKey } from "@/lib/r2";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/**
 * Issues a short-lived presigned R2 upload URL for a photo. The browser
 * uploads the file bytes straight to R2 — this route never sees them, it
 * just proves the caller owns the tribute page they're uploading to.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { pageId, contentType } = await request.json();

  if (!pageId || !ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const { data: page } = await supabase
    .from("tribute_pages")
    .select("id")
    .eq("id", pageId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!page) {
    return NextResponse.json({ error: "Tribute page not found" }, { status: 404 });
  }

  const extension = contentType.split("/")[1] ?? "jpg";
  const key = `tributes/${pageId}/${randomUUID()}.${extension}`;
  const uploadUrl = await createPresignedUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key, publicUrl: publicUrlForKey(key) });
}
