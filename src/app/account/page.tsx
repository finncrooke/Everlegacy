import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SignOutButton } from "@/components/SignOutButton";
import { WelcomeNotifier } from "@/components/WelcomeNotifier";
import { generateQrDataUrl, tributeUrl } from "@/lib/qrcode";
import { listTributePages } from "@/lib/tribute";

const STATUS_LABELS: Record<string, string> = {
  processing: "Being made",
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

  const pages = await listTributePages(supabase, user.id);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, plaque_quantity, tribute_page_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ordersByPage = new Map<string, typeof orders>();
  for (const order of orders ?? []) {
    if (!order.tribute_page_id) continue;
    const existing = ordersByPage.get(order.tribute_page_id) ?? [];
    ordersByPage.set(order.tribute_page_id, [...existing, order]);
  }

  const cards = await Promise.all(
    pages.map(async (page) => {
      const url = tributeUrl(page.slug);
      const qrDataUrl = await generateQrDataUrl(url);
      return { page, url, qrDataUrl, orders: ordersByPage.get(page.id) ?? [] };
    })
  );

  return (
    <div className="min-h-screen bg-evergreen-950">
      <SiteHeader />
      <Suspense fallback={null}>
        <WelcomeNotifier />
      </Suspense>
      <section className="bg-cream-50 py-16">
        <div className="container-page max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="heading-caps text-evergreen-700">Your account</p>
              <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Your tribute pages</h1>
            </div>
            <SignOutButton />
          </div>

          {cards.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-evergreen-900/10 bg-white p-8 text-center">
              <p className="text-evergreen-900/75">You haven&apos;t built a tribute page yet.</p>
              <Link href="/account/new" className="btn-primary mt-4 inline-flex">
                Build your first tribute page
              </Link>
            </div>
          ) : (
            <div className="mt-10 space-y-6">
              {cards.map(({ page, url, qrDataUrl, orders: pageOrders }) => (
                <div key={page.id} className="rounded-2xl border border-evergreen-900/10 bg-white p-8">
                  <div className="grid gap-8 sm:grid-cols-[auto,1fr] sm:items-start">
                    <div className="flex flex-col items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt={`QR code linking to ${page.full_name || "the tribute page"}`}
                        width={140}
                        height={140}
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

                    <div>
                      <h2 className="font-serif text-xl text-evergreen-950">
                        {page.full_name || "Untitled tribute page"}
                      </h2>
                      <p className="mt-1 text-sm text-evergreen-900/70">
                        {page.published ? (
                          <a href={url} target="_blank" rel="noreferrer" className="break-all underline">
                            {url}
                          </a>
                        ) : (
                          "Not published yet"
                        )}
                      </p>

                      {pageOrders.length > 0 ? (
                        <ul className="mt-4 space-y-1 text-sm text-evergreen-900/80">
                          {pageOrders.map((order) => (
                            <li key={order.id}>
                              {order.plaque_quantity} {order.plaque_quantity === 1 ? "plaque" : "plaques"} —{" "}
                              <span className="font-medium">{STATUS_LABELS[order.status] ?? order.status}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-sm text-evergreen-900/70">No plaque ordered for this page yet.</p>
                      )}

                      <div className="mt-6 flex flex-wrap gap-4">
                        <Link href={`/account/edit?page=${page.id}`} className="btn-primary">
                          Edit page
                        </Link>
                        <Link href={`/order?page=${page.id}`} className="btn-secondary bg-evergreen-950 text-cream-50">
                          {pageOrders.length > 0 ? "Order more plaques" : "Order a plaque"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Link
                href="/account/new"
                className="block rounded-2xl border-2 border-dashed border-evergreen-900/20 p-8 text-center text-evergreen-900/70 hover:border-evergreen-900/40"
              >
                + Build another tribute page
              </Link>
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
