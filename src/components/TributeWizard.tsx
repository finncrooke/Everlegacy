"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { possessive } from "@/lib/text";

type Photo = { storagePath: string; publicUrl: string };
type TimelineEntry = { entryDate: string; title: string; description: string };

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic"];

/**
 * First-run experience for building a brand new tribute page — a short,
 * focused sequence of questions (name first, then optional sections you
 * can skip) rather than one long form. Editing an existing page later uses
 * the full TributeEditor instead; this is only ever for creating one.
 */
export function TributeWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pageId, setPageId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateOfPassing, setDateOfPassing] = useState("");
  const [epitaph, setEpitaph] = useState("");
  const [story, setStory] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = ["name", "dates", "epitaph", "story", "photos", "timeline", "done"] as const;

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setError(null);
    setCreating(true);

    const res = await fetch("/api/tribute/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: fullName.trim() }),
    });
    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setPageId(data.id);
    setSlug(data.slug);
    setStep(1);
  }

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  async function uploadFiles(files: FileList) {
    if (!pageId) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      try {
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId, contentType: file.type }),
        });
        if (!presignRes.ok) continue;
        const { uploadUrl, key, publicUrl } = await presignRes.json();
        await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        setPhotos((prev) => [...prev, { storagePath: key, publicUrl }]);
      } catch (err) {
        console.error("Photo upload failed", err);
      }
    }
    setUploading(false);
  }

  function addTimelineEntry() {
    setTimeline((prev) => [...prev, { entryDate: "", title: "", description: "" }]);
  }

  function updateTimelineEntry(i: number, patch: Partial<TimelineEntry>) {
    setTimeline((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  async function saveAll(published: boolean) {
    if (!pageId) return false;
    const res = await fetch("/api/tribute/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId,
        fullName,
        dateOfBirth,
        dateOfPassing,
        epitaph,
        story,
        visibility: "unlisted",
        published,
        photos: photos.map((p, i) => ({ storagePath: p.storagePath, isCover: i === 0 })),
        timeline,
      }),
    });
    return res.ok;
  }

  async function handleContinueToOrder() {
    setFinishing(true);
    // Not published yet — the page only goes live once the plaque is
    // actually paid for, so nobody can see it (or scan a QR to it) before
    // that. The Stripe webhook publishes it on payment success.
    const ok = await saveAll(false);
    setFinishing(false);
    if (ok) router.push(`/order?page=${pageId}`);
    else setError("Couldn't save — please try again.");
  }

  async function handleFinishLater() {
    setFinishing(true);
    await saveAll(false);
    setFinishing(false);
    router.push("/account");
  }

  const stepName = steps[step];

  return (
    <div className="min-h-screen bg-evergreen-950">
      <header className="border-b border-white/10 bg-evergreen-950">
        <div className="container-page flex h-20 items-center">
          <span className="heading-caps text-cream-50 tracking-widest2">Everlegacy</span>
        </div>
      </header>

      <section className="bg-cream-50 py-20">
        <div className="container-page max-w-xl">
          {/* Progress dots */}
          <div className="mb-10 flex items-center gap-2" aria-hidden="true">
            {steps.slice(0, -1).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-gold-500" : "bg-evergreen-900/10"
                }`}
              />
            ))}
          </div>

          <div key={stepName} className="wizard-step-in">
            {stepName === "name" && (
              <form onSubmit={handleNameSubmit}>
                <p className="heading-caps text-evergreen-700">Let&apos;s begin</p>
                <h1 className="mt-2 font-serif text-3xl text-evergreen-950">
                  Who is this tribute page for?
                </h1>
                <p className="mt-2 text-evergreen-900/70">Their full name, as you&apos;d like it shown.</p>
                <input
                  autoFocus
                  className="field-input mt-6 text-lg"
                  placeholder="e.g. Margaret Ellen Hughes"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={creating || !fullName.trim()} className="btn-primary mt-6">
                  {creating ? "Starting…" : "Continue"}
                </button>
              </form>
            )}

            {stepName === "dates" && (
              <div>
                <p className="heading-caps text-evergreen-700">Optional</p>
                <h1 className="mt-2 font-serif text-3xl text-evergreen-950">When were they born and when did they pass?</h1>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
                <StepActions onSkip={next} onContinue={next} />
              </div>
            )}

            {stepName === "epitaph" && (
              <div>
                <p className="heading-caps text-evergreen-700">Optional</p>
                <h1 className="mt-2 font-serif text-3xl text-evergreen-950">A short line that captures them?</h1>
                <p className="mt-2 text-evergreen-900/70">An epitaph or quote — one line is plenty.</p>
                <input
                  className="field-input mt-6"
                  placeholder="A quiet kindness that touched everyone she met"
                  maxLength={140}
                  value={epitaph}
                  onChange={(e) => setEpitaph(e.target.value)}
                />
                <StepActions onSkip={next} onContinue={next} />
              </div>
            )}

            {stepName === "story" && (
              <div>
                <p className="heading-caps text-evergreen-700">Optional</p>
                <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Tell their story</h1>
                <p className="mt-2 text-evergreen-900/70">Who they were, what they loved, how they&apos;ll be remembered.</p>
                <textarea
                  className="field-input mt-6 min-h-[160px]"
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                />
                <StepActions onSkip={next} onContinue={next} />
              </div>
            )}

            {stepName === "photos" && (
              <div>
                <p className="heading-caps text-evergreen-700">Optional</p>
                <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Add a few photos</h1>
                <p className="mt-2 text-evergreen-900/70">The first one becomes the cover photo.</p>

                {photos.length > 0 && (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {photos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.storagePath} src={p.publicUrl} alt="" className="aspect-square w-full rounded-lg object-cover" />
                    ))}
                  </div>
                )}

                <label
                  htmlFor="wizard-photo-upload"
                  className="mt-6 flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-evergreen-900/20 px-6 py-6 text-center hover:border-evergreen-900/40"
                >
                  <span className="font-medium text-evergreen-950">
                    {uploading ? "Uploading…" : "Drag photos here, or click to choose"}
                  </span>
                </label>
                <input
                  id="wizard-photo-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/heic"
                  multiple
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                />
                <StepActions onSkip={next} onContinue={next} />
              </div>
            )}

            {stepName === "timeline" && (
              <div>
                <p className="heading-caps text-evergreen-700">Optional</p>
                <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Any milestones worth marking?</h1>
                <p className="mt-2 text-evergreen-900/70">
                  Like &ldquo;1985 — Married Jane&rdquo; or &ldquo;2001 — Opened the family shop&rdquo;.
                </p>
                <div className="mt-6 space-y-4">
                  {timeline.map((entry, i) => (
                    <div key={i} className="grid gap-3 rounded-lg border border-evergreen-900/10 p-4 sm:grid-cols-[100px,1fr]">
                      <input
                        className="field-input"
                        placeholder="1985"
                        value={entry.entryDate}
                        onChange={(e) => updateTimelineEntry(i, { entryDate: e.target.value })}
                      />
                      <input
                        className="field-input"
                        placeholder="Married Jane"
                        value={entry.title}
                        onChange={(e) => updateTimelineEntry(i, { title: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addTimelineEntry} className="btn-secondary mt-4 bg-evergreen-950 text-cream-50">
                  Add a milestone
                </button>
                <StepActions onSkip={next} onContinue={next} />
              </div>
            )}

            {stepName === "done" && (
              <div>
                <p className="heading-caps text-evergreen-700">All set</p>
                <h1 className="mt-2 font-serif text-3xl text-evergreen-950">
                  {possessive(fullName.split(" ")[0])} tribute page is ready
                </h1>
                <p className="mt-2 text-evergreen-900/70">
                  Order a plaque now so it&apos;s on its way, or come back to it whenever you like —
                  everything&apos;s already saved.
                </p>
                {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
                <div className="mt-6 flex flex-wrap gap-4">
                  <button type="button" onClick={handleContinueToOrder} disabled={finishing} className="btn-primary">
                    {finishing ? "Saving…" : "Continue to order"}
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishLater}
                    disabled={finishing}
                    className="btn-secondary bg-evergreen-950 text-cream-50"
                  >
                    I&apos;ll order later
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StepActions({ onSkip, onContinue }: { onSkip: () => void; onContinue: () => void }) {
  return (
    <div className="mt-6 flex items-center gap-4">
      <button type="button" onClick={onContinue} className="btn-primary">
        Continue
      </button>
      <button type="button" onClick={onSkip} className="text-sm font-medium text-evergreen-800 underline min-h-[44px]">
        Skip
      </button>
    </div>
  );
}
