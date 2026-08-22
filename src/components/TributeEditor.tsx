"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";

type Photo = {
  id?: string;
  storagePath: string;
  publicUrl: string;
  isCover: boolean;
  altText: string;
};

type TimelineEntry = {
  id?: string;
  entryDate: string;
  title: string;
  description: string;
};

type PageData = {
  id: string;
  slug: string;
  fullName: string;
  dateOfBirth: string;
  dateOfPassing: string;
  epitaph: string;
  story: string;
  visibility: "public" | "unlisted";
  published: boolean;
};

export function TributeEditor({
  page,
  initialPhotos,
  initialTimeline,
}: {
  page: PageData;
  initialPhotos: Photo[];
  initialTimeline: TimelineEntry[];
}) {
  const [fullName, setFullName] = useState(page.fullName);
  const [dateOfBirth, setDateOfBirth] = useState(page.dateOfBirth);
  const [dateOfPassing, setDateOfPassing] = useState(page.dateOfPassing);
  const [epitaph, setEpitaph] = useState(page.epitaph);
  const [story, setStory] = useState(page.story);
  const [visibility, setVisibility] = useState<"public" | "unlisted">(page.visibility);
  const [published, setPublished] = useState(page.published);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [timeline, setTimeline] = useState<TimelineEntry[]>(initialTimeline);

  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = useCallback(
    async (overrides?: { published?: boolean }) => {
      setStatus("saving");
      try {
        const res = await fetch("/api/tribute/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId: page.id,
            fullName,
            dateOfBirth,
            dateOfPassing,
            epitaph,
            story,
            visibility,
            published: overrides?.published ?? published,
            photos,
            timeline,
          }),
        });
        if (!res.ok) throw new Error("save failed");
        if (overrides?.published !== undefined) setPublished(overrides.published);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [page.id, fullName, dateOfBirth, dateOfPassing, epitaph, story, visibility, published, photos, timeline]
  );

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId: page.id, contentType: file.type }),
        });
        if (!presignRes.ok) continue;
        const { uploadUrl, key, publicUrl } = await presignRes.json();

        await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });

        setPhotos((prev) => [
          ...prev,
          { storagePath: key, publicUrl, isCover: prev.length === 0, altText: "" },
        ]);
      } catch (err) {
        console.error("Photo upload failed", err);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function setCover(index: number) {
    setPhotos((prev) => prev.map((p, i) => ({ ...p, isCover: i === index })));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length && !next.some((p) => p.isCover)) next[0].isCover = true;
      return next;
    });
  }

  function updateAlt(index: number, altText: string) {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, altText } : p)));
  }

  function addTimelineEntry() {
    setTimeline((prev) => [...prev, { entryDate: "", title: "", description: "" }]);
  }

  function updateTimelineEntry(index: number, patch: Partial<TimelineEntry>) {
    setTimeline((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function removeTimelineEntry(index: number) {
    setTimeline((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="mt-10 space-y-10">
      <fieldset className="space-y-6 rounded-2xl border border-evergreen-900/10 bg-white p-8">
        <legend className="heading-caps text-evergreen-700 px-1">About them</legend>
        <div>
          <label htmlFor="fullName" className="field-label">
            Full name
          </label>
          <input
            id="fullName"
            className="field-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Margaret Ellen Hughes"
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="dob" className="field-label">
              Date of birth
            </label>
            <input
              id="dob"
              type="date"
              className="field-input"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="dop" className="field-label">
              Date of passing
            </label>
            <input
              id="dop"
              type="date"
              className="field-input"
              value={dateOfPassing}
              onChange={(e) => setDateOfPassing(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="epitaph" className="field-label">
            Epitaph or quote (optional)
          </label>
          <input
            id="epitaph"
            className="field-input"
            value={epitaph}
            onChange={(e) => setEpitaph(e.target.value)}
            placeholder="A short line that captures them"
            maxLength={140}
          />
        </div>
        <div>
          <label htmlFor="story" className="field-label">
            Their story
          </label>
          <textarea
            id="story"
            className="field-input min-h-[180px]"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Share who they were, what they loved, and how they'll be remembered."
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-evergreen-900/10 bg-white p-8">
        <legend className="heading-caps text-evergreen-700 px-1">Photos</legend>
        <p className="text-sm text-evergreen-900/70">
          Upload as many photos as you'd like. Mark one as the cover photo — it appears at the
          top of the page.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {photos.map((photo, i) => (
            <div key={photo.storagePath} className="overflow-hidden rounded-lg border border-evergreen-900/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.publicUrl} alt={photo.altText || "Tribute photo"} className="h-40 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 bg-evergreen-950 px-3 text-sm text-cream-50">
                <button
                  type="button"
                  onClick={() => setCover(i)}
                  className={`min-h-[44px] py-2 ${photo.isCover ? "font-semibold text-gold-400" : "underline"}`}
                >
                  {photo.isCover ? "Cover photo" : "Set as cover"}
                </button>
                <button type="button" onClick={() => removePhoto(i)} className="min-h-[44px] py-2 underline">
                  Remove
                </button>
              </div>
              <label className="sr-only" htmlFor={`alt-${i}`}>
                Description of this photo for screen readers
              </label>
              <input
                id={`alt-${i}`}
                className="min-h-[44px] w-full border-t border-evergreen-900/10 px-3 py-2 text-sm"
                placeholder="Describe this photo"
                value={photo.altText}
                onChange={(e) => updateAlt(i, e.target.value)}
              />
            </div>
          ))}
        </div>
        <label htmlFor="photo-upload" className="btn-secondary mt-2 inline-flex bg-evergreen-950 text-cream-50 cursor-pointer">
          {uploading ? "Uploading…" : "Add photos"}
        </label>
        <input
          id="photo-upload"
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/heic"
          multiple
          className="sr-only"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-evergreen-900/10 bg-white p-8">
        <legend className="heading-caps text-evergreen-700 px-1">Timeline (optional)</legend>
        <p className="text-sm text-evergreen-900/70">
          Add milestones like "1985 — Married Jane" or "2001 — Opened the family shop".
        </p>
        <div className="space-y-6">
          {timeline.map((entry, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-evergreen-900/10 p-4 sm:grid-cols-[120px,1fr]">
              <div>
                <label htmlFor={`tl-date-${i}`} className="field-label">
                  Date
                </label>
                <input
                  id={`tl-date-${i}`}
                  className="field-input"
                  placeholder="1985"
                  value={entry.entryDate}
                  onChange={(e) => updateTimelineEntry(i, { entryDate: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label htmlFor={`tl-title-${i}`} className="field-label">
                    Title
                  </label>
                  <input
                    id={`tl-title-${i}`}
                    className="field-input"
                    placeholder="Married Jane"
                    value={entry.title}
                    onChange={(e) => updateTimelineEntry(i, { title: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor={`tl-desc-${i}`} className="field-label">
                    Description (optional)
                  </label>
                  <textarea
                    id={`tl-desc-${i}`}
                    className="field-input"
                    value={entry.description}
                    onChange={(e) => updateTimelineEntry(i, { description: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeTimelineEntry(i)}
                  className="min-h-[44px] py-2 text-sm underline"
                >
                  Remove this entry
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addTimelineEntry} className="btn-secondary bg-evergreen-950 text-cream-50">
          Add timeline entry
        </button>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-evergreen-900/10 bg-white p-8">
        <legend className="heading-caps text-evergreen-700 px-1">Privacy</legend>
        <div className="flex flex-col gap-3">
          <label className="flex items-start gap-3">
            <input
              type="radio"
              name="visibility"
              checked={visibility === "unlisted"}
              onChange={() => setVisibility("unlisted")}
              className="mt-1 h-5 w-5"
            />
            <span>
              <span className="block font-medium text-evergreen-950">Unlisted (recommended)</span>
              <span className="block text-sm text-evergreen-900/70">
                Only people with the direct link or QR code can view the page. It won't appear in
                search engines.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="radio"
              name="visibility"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
              className="mt-1 h-5 w-5"
            />
            <span>
              <span className="block font-medium text-evergreen-950">Public</span>
              <span className="block text-sm text-evergreen-900/70">
                Anyone can view the page and it may be found via search.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-4 rounded-2xl border border-evergreen-900/10 bg-white/95 p-6 backdrop-blur">
        <button type="button" onClick={() => save()} className="btn-primary">
          Save
        </button>
        {published ? (
          <Link href={`/t/${page.slug}`} target="_blank" className="btn-secondary bg-evergreen-950 text-cream-50">
            View live page
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => save({ published: true })}
            className="btn-secondary bg-evergreen-950 text-cream-50"
          >
            Save and publish
          </button>
        )}
        <a
          href={`/t/${page.slug}?preview=1`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] items-center text-sm underline"
        >
          Preview before publishing
        </a>
        <span role="status" aria-live="polite" className="text-sm text-evergreen-900/70">
          {status === "saving" && "Saving…"}
          {status === "saved" && "All changes saved."}
          {status === "error" && "Couldn't save — please try again."}
        </span>
      </div>
    </div>
  );
}
