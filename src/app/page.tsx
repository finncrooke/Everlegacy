import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PLAQUE_TIERS } from "@/lib/pricing";

const steps = [
  {
    title: "Build their page",
    body: "Create a free account and add photos, dates, a story or a few words that capture who they were.",
  },
  {
    title: "Order the plaque",
    body: "Once their page is ready, order — most people get more than one, at a lower price each.",
  },
  {
    title: "Receive the plaque",
    body: "We engrave a weatherproof QR plaque and post it to you, ready to fit.",
  },
  {
    title: "Attach it to the headstone",
    body: "Anyone who scans it is taken straight to the tribute page you built.",
  },
];

const faqs = [
  {
    q: "How durable is the plaque?",
    a: "Each plaque is made from weatherproof, UV-stable material designed to withstand years outdoors in all weather, without fading or the code becoming unreadable.",
  },
  {
    q: "How long does the tribute page stay online?",
    a: "For as long as Everlegacy operates, with no extra fees. It's a one-time payment — there's no subscription to keep the page live.",
  },
  {
    q: "Who can see the tribute page?",
    a: "By default, pages are unlisted: they're never listed publicly or indexed by search engines, and can only be found by someone with the direct link or QR code. You can choose to make a page fully public at any time.",
  },
  {
    q: "What happens if Everlegacy closes?",
    a: "We'll be upfront about it. Every page's photos, story and details can be exported to a simple file, and we'll give notice and instructions well ahead of time.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-evergreen-950">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-evergreen-950 pb-20 pt-16 sm:pt-24">
        <div className="container-page grid items-center gap-12 sm:grid-cols-2">
          <div>
            <h1 className="font-serif text-4xl leading-tight text-cream-50 sm:text-5xl">
              A QR plaque for their headstone. Scan it, and their story lives on.
            </h1>
            <p className="mt-6 max-w-md text-lg text-cream-100/85">
              Build a free tribute page with photos and memories, then order a small,
              weatherproof plaque engraved with a QR code linking straight to it. Anyone
              who visits can scan it and remember them, in their own words.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/signup" className="btn-primary">
                Start building — free
              </Link>
              <Link href="#example" className="btn-secondary">
                See an example page
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10">
            <Image
              src="/brand/plaque-1.png"
              alt="A gold QR plaque engraved and fitted onto a headstone, next to the dates and inscription"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-cream-50 py-20">
        <div className="container-page">
          <p className="heading-caps text-evergreen-700">How it works</p>
          <h2 className="mt-2 font-serif text-3xl text-evergreen-950">
            From order to headstone in four simple steps
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title}>
                <span className="heading-caps text-gold-700">Step {i + 1}</span>
                <h3 className="mt-2 font-serif text-xl text-evergreen-950">{step.title}</h3>
                <p className="mt-2 text-evergreen-900/75">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Example tribute page preview */}
      <section id="example" className="bg-evergreen-900 py-20">
        <div className="container-page">
          <p className="heading-caps text-gold-400">An example tribute page</p>
          <h2 className="mt-2 font-serif text-3xl text-cream-50">
            Simple, calm, and built to be read at a graveside
          </h2>
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-cream-50 shadow-2xl sm:mx-auto sm:max-w-md">
            <div className="flex h-48 items-center justify-center bg-evergreen-800 text-cream-100/60">
              Cover photo
            </div>
            <div className="p-8 text-center">
              <h3 className="font-serif text-2xl text-evergreen-950">Margaret Ellen Hughes</h3>
              <p className="mt-1 text-evergreen-900/70">3 April 1938 – 19 November 2024</p>
              <p className="mt-4 font-serif italic text-evergreen-900/80">
                &ldquo;A quiet kindness that touched everyone she met.&rdquo;
              </p>
              <p className="mt-6 text-left text-sm leading-relaxed text-evergreen-900/80">
                Margaret spent forty years teaching at St. Anne&apos;s Primary, where
                generations of children came to know her patience and her love of
                storytelling. She is remembered by her three children, seven
                grandchildren, and the countless pupils she inspired...
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-cream-100/60">
            (Illustrative example — not a real customer page)
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-cream-50 py-20">
        <div className="container-page max-w-3xl text-center">
          <p className="heading-caps text-evergreen-700">Pricing</p>
          <h2 className="mt-2 font-serif text-3xl text-evergreen-950">
            Build the page free. Order plaques when you&apos;re ready.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-evergreen-900/70">
            No payment to start — create your account and build the tribute page first. Most
            families order more than one plaque, so the price drops the more you get.
          </p>
          <div className="mx-auto mt-10 grid gap-6 sm:grid-cols-3">
            {PLAQUE_TIERS.map((tier) => (
              <div
                key={tier.quantity}
                className={`rounded-2xl border p-8 shadow-sm ${
                  tier.quantity === 2
                    ? "border-gold-500 bg-white ring-2 ring-gold-500"
                    : "border-evergreen-900/10 bg-white"
                }`}
              >
                <p className="heading-caps text-evergreen-700">
                  {tier.quantity} {tier.quantity === 1 ? "plaque" : "plaques"}
                </p>
                <p className="mt-3 font-serif text-4xl text-evergreen-950">£{tier.totalGBP}</p>
                <p className="mt-1 text-sm text-evergreen-900/60">
                  £{(tier.totalGBP / tier.quantity).toFixed(2)} each
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-evergreen-900/60">
            One-time payment. Includes engraving, UK delivery, and your tribute page for as
            long as Everlegacy operates.
          </p>
          <Link href="/signup" className="btn-primary mt-8 inline-flex bg-gold-500 text-evergreen-950">
            Start building — free
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-evergreen-950 py-20">
        <div className="container-page max-w-3xl">
          <p className="heading-caps text-gold-400">Questions</p>
          <h2 className="mt-2 font-serif text-3xl text-cream-50">Frequently asked questions</h2>
          <dl className="mt-10 divide-y divide-white/10">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-6">
                <dt>
                  <h3 className="font-serif text-lg text-cream-50">{faq.q}</h3>
                </dt>
                <dd className="mt-2 text-cream-100/80">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
