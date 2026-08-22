import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OrderForm } from "@/components/OrderForm";
import { getOwnedTributePage, listTributePages } from "@/lib/tribute";
import { possessive } from "@/lib/text";

export default async function OrderPage({ searchParams }: { searchParams: { page?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signup");
  }

  let page;
  if (searchParams.page) {
    page = await getOwnedTributePage(supabase, user.id, searchParams.page);
    if (!page) redirect("/account");
  } else {
    const pages = await listTributePages(supabase, user.id);
    if (pages.length === 0) redirect("/account/new");
    if (pages.length === 1) {
      page = pages[0];
    } else {
      // More than one page — ask which this order is for rather than
      // guessing, so plaques never end up linked to the wrong page.
      return (
        <div className="min-h-screen bg-evergreen-950">
          <SiteHeader />
          <section className="bg-cream-50 py-16">
            <div className="container-page max-w-2xl">
              <p className="heading-caps text-evergreen-700">Order</p>
              <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Which tribute page is this for?</h1>
              <p className="mt-2 text-evergreen-900/75">You have more than one — pick the one to order a plaque for.</p>
              <div className="mt-8 space-y-4">
                {pages.map((p) => (
                  <Link
                    key={p.id}
                    href={`/order?page=${p.id}`}
                    className="block rounded-xl border border-evergreen-900/15 bg-white p-6 hover:border-gold-500"
                  >
                    <span className="font-serif text-lg text-evergreen-950">{p.full_name || "Untitled tribute page"}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
          <SiteFooter />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-evergreen-950">
      <SiteHeader />
      <section className="bg-cream-50 py-16">
        <div className="container-page max-w-2xl">
          <p className="heading-caps text-evergreen-700">Order</p>
          <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Order your plaque</h1>
          <p className="mt-2 text-evergreen-900/75">
            {page.full_name
              ? `For ${possessive(page.full_name)} tribute page. Most people order more than one — a spare, or one for another family member's visit.`
              : "Most people order more than one plaque — a spare, or one for another family member's visit."}
          </p>

          <OrderForm pageId={page.id} />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
