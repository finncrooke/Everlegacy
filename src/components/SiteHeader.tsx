import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-evergreen-950">
      <div className="container-page flex h-20 items-center justify-between">
        <Link
          href="/"
          className="heading-caps text-cream-50 tracking-widest2"
          aria-label="Everlegacy home"
        >
          Everlegacy
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-6">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-cream-100/90 hover:text-gold-400 sm:inline-block"
          >
            Log in
          </Link>
          <Link href="/order" className="btn-primary text-sm px-6 py-3">
            Order now
          </Link>
        </nav>
      </div>
    </header>
  );
}
