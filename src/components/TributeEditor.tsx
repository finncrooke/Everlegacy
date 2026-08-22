"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic"];

export function TributeEditor({
  page,
  initialPhotos,
  initialTimeline,
}: {
  page: PageData;
  initialPhotos: Photo[];
  initialTimeline: TimelineEntry[];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(page.fullName);
  const [dateOfBirth, setDateOfBirth] = useState(page.dateOfBirth);
  const [dateOfPassing, setDateOfPassing] = useState(page.dateOfPassing);
  const [epitaph, setEpitaph] = useState(page.epitaph);
  const [story, setStory] = useState(page.story);
  const [visibility, setVisibility] = useState<"public" | "unlisted">(page.visibility);
  const [published, setPublished] = useState(page.published);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [timeline, setTimeline] = useState<TimelineEntry[]>(initialTimeline);

  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "heading-to-order">(
    "idle"
  );
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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
        const data = await res.json();
        if (overrides?.published !== undefined) setPublished(overrides.published);

        // First time this page is ever saved with a name on it, hand the
        // customer straight to ordering a plaque for it — keeps momentum
        // going from "built the page" to "ordered the plaque" in one flow.
        if (data.firstSave && fullName.trim()) {
          setStatus("heading-to-order");
          setTimeout(() => router.push("/order"), 600);
          return;
        }

        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [page.id, fullName, dateOfBirth, dateOfPassing, epitaph, story, visibility, published, photos, timeline, router]
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => ACCEPTED_TYPES.includes(f.type));
      if (list.length === 0) return;
      setUploading(true);

      for (const file of list) {
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
    },
    [page.id]
  );

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) await uploadFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
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
    <div className="mt-10 space-y-8 pb-28">
      {/* 1. About them — the essential, always-open section */}
      <section className="rounded-2xl border border-evergreen-900/10 bg-white p-8">
        <div className="mb-6 flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-evergreen-950 font-serif text-sm text-gold-400"
            aria-hidden="true"
          >
            1
          </span>
          <div>
            <h2 className="font-serif text-xl text-evergreen-950">About them</h2>
            <p className="text-sm text-evergreen-900/60">The essentials — this is most of the page.</p>
          </div>
        </div>
        <div className="space-y-6">
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
        </div>
      </section>

      {/* 2. Photos — also essential, also always-open */}
      <section className="rounded-2xl border border-evergreen-900/10 bg-white p-8">
        <div className="mb-6 flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-evergreen-950 font-serif text-sm text-gold-400"
            aria-hidden="true"
          >
            2
          </span>
          <div>
            <h2 className="font-serif text-xl text-evergreen-950">Photos</h2>
            <p className="text-sm text-evergreen-900/60">
              Add as many as you&apos;d like. Mark one as the cover photo.
            </p>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {photos.map((photo, i) => (
              <div key={photo.storagePath} className="overflow-hidden rounded-lg border border-evergreen-900/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.publicUrl}
                  alt={photo.altText || "Tribute photo"}
                  className="h-40 w-full object-cover"
                />
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
        )}

        <label
          htmlFor="photo-upload"
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragActive
              ? "border-gold-500 bg-gold-500/10"
              : "border-evergreen-900/20 hover:border-evergreen-900/40"
          }`}
        >
          <span className="font-medium text-evergreen-950">
            {uploading ? "Uploading…" : "Drag photos here, or click to choose"}
          </span>
          <span className="text-sm text-evergreen-900/60">JPG, PNG, WEBP or HEIC</span>
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
      </section>

      {/* 3. Timeline — optional, collapsed by default */}
      <details className="group rounded-2xl border border-evergreen-900/10 bg-white p-8 open:pb-8">
        <summary className="flex cursor-pointer list-none items-center justify-between">
          <div>
            <p className="heading-caps text-evergreen-700">Optional</p>
            <h2 className="mt-1 font-serif text-xl text-evergreen-950">Timeline</h2>
          </div>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-evergreen-900/15 text-lg text-evergreen-700 transition-transform group-open:rotate-45"
            aria-hidden="true"
          >
            +
          </span>
        </summary>
        <div className="mt-6 space-y-6">
          <p className="text-sm text-evergreen-900/70">
            Add milestones like &ldquo;1985 — Married Jane&rdquo; or &ldquo;2001 — Opened the family
            shop&rdquo;.
          </p>
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
          <button type="button" onClick={addTimelineEntry} className="btn-secondary bg-evergreen-950 text-cream-50">
            Add timeline entry
          </button>
        </div>
      </details>

      {/* 4. Privacy — optional, collapsed by default (already defaults to unlisted) */}
      <details className="group rounded-2xl border border-evergreen-900/10 bg-white p-8 open:pb-8">
        <summary className="flex cursor-pointer list-none items-center justify-between">
          <div>
            <p className="heading-caps text-evergreen-700">Optional</p>
            <h2 className="mt-1 font-serif text-xl text-evergreen-950">Privacy</h2>
            <p className="mt-1 text-sm text-evergreen-900/60">
              Currently: {visibility === "public" ? "Public" : "Unlisted (recommended)"}
            </p>
          </div>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-evergreen-900/15 text-lg text-evergreen-700 transition-transform group-open:rotate-45"
            aria-hidden="true"
          >
            +
          </span>
        </summary>
        <div className="mt-6 flex flex-col gap-3">
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
                Only people with the direct link or QR code can view the page. It won&apos;t appear in
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
      </details>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-4 rounded-2xl border border-evergreen-900/10 bg-white/95 p-6 shadow-[0_-4px_20px_rgba(15,43,33,0.08)] backdrop-blur">
        <button type="button" onClick={() => save()} className="btn-primary" disabled={status === "saving"}>
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
            disabled={status === "saving"}
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
          {status === "heading-to-order" && "Saved! Taking you to order your plaque…"}
          {status === "error" && "Couldn't save — please try again."}
        </span>
      </div>
    </div>
  );
}
