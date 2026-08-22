import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SignOutButton } from "@/components/SignOutButton";
import { generateQrDataUrl, tributeUrl } from "@/lib/qrcode";

const STATUS_STEPS = ["processing", "shipped", "delivered"] as const;
const STATUS_LABELS: Record<(typeof STATUS_STEPS)[number], string> = {
  processing: "Your plaque is being made",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, created_at, shipping_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: page } = await supabase
    .from("tribute_pages")
    .select("id, slug, full_name, published, visibility")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const url = page ? tributeUrl(page.slug) : null;
  const qrDataUrl = url ? await generateQrDataUrl(url) : null;
  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]) : -1;

  return (
    <div className="min-h-screen bg-evergreen-950">
      <SiteHeader />
      <section className="bg-cream-50 py-16">
        <div className="container-page max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="heading-caps text-evergreen-700">Your account</p>
              <h1 className="mt-2 font-serif text-3xl text-evergreen-950">
                Welcome{order?.shipping_name ? `, ${order.shipping_name.split(" ")[0]}` : ""}
              </h1>
            </div>
            <SignOutButton />
          </div>

          {/* Order status */}
          <div className="mt-10 rounded-2xl border border-evergreen-900/10 bg-white p-8">
            <h2 className="heading-caps text-evergreen-700">Order status</h2>
            {order ? (
              <ol className="mt-6 flex flex-col gap-4 sm:flex-row sm:gap-0">
                {STATUS_STEPS.map((step, i) => (
                  <li key={step} className="flex flex-1 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        i <= currentStepIndex
                          ? "bg-gold-500 text-evergreen-950"
                          : "bg-evergreen-900/10 text-evergreen-900/40"
                      }`}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span
                      className={i <= currentStepIndex ? "font-medium text-evergreen-950" : "text-evergreen-900/70"}
                    >
                      {STATUS_LABELS[step]}
                    </span>
                    {i < STATUS_STEPS.length - 1 && (
                      <span className="mx-2 hidden h-px flex-1 bg-evergreen-900/10 sm:block" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-evergreen-900/70">We couldn't find an order on your account.</p>
            )}
          </div>

          {/* Tribute page */}
          <div className="mt-8 rounded-2xl border border-evergreen-900/10 bg-white p-8">
            <h2 className="heading-caps text-evergreen-700">Tribute page</h2>
            {page ? (
              <div className="mt-6 grid gap-8 sm:grid-cols-[auto,1fr] sm:items-start">
                {qrDataUrl && (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt={`QR code linking to ${page.full_name || "the tribute page"}`}
                      width={180}
                      height={180}
                      className="rounded-lg border border-evergreen-900/10"
                    />
                    <a
                      href={qrDataUrl}
                      download={`everlegacy-qr-${page.slug}.png`}
                      className="inline-flex min-h-[44px] items-center text-sm underline"
                    >
                      Download QR code
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-evergreen-900/80">
                    {page.published
                      ? "Your page is live. Anyone with this link can view it:"
                      : "Your page isn't published yet. Finish it in the editor, then publish it."}
                  </p>
                  {url && (
                    <p className="mt-2 break-all font-medium text-evergreen-950">
                      <a href={url} target="_blank" rel="noreferrer" className="underline">
                        {url}
                      </a>
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap gap-4">
                    <Link href="/account/edit" className="btn-primary">
                      {page.full_name ? "Edit tribute page" : "Start building the page"}
                    </Link>
                    {page.published && (
                      <Link href={`/t/${page.slug}`} className="btn-secondary bg-evergreen-950 text-cream-50">
                        Preview page
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-evergreen-900/70">
                We're still setting up your tribute page — refresh in a moment.
              </p>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
