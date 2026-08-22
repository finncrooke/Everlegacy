import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-evergreen-950 py-12 text-cream-100/80">
      <div className="container-page flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <Image
            src="/brand/logo.png"
            alt="Everlegacy"
            width={168}
            height={94}
            className="h-7 w-auto sm:mx-0 mx-auto"
          />
          <p className="mt-2 text-sm">
            Contact us at{" "}
            <a href="mailto:support@everlegacy.link" className="underline hover:text-gold-400">
              support@everlegacy.link
            </a>
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-6 text-sm">
          <Link href="/#faq" className="hover:text-gold-400">
            FAQ
          </Link>
          <Link href="/signup" className="hover:text-gold-400">
            Get started
          </Link>
          <Link href="/login" className="hover:text-gold-400">
            Log in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
