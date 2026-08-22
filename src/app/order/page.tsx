import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OrderForm } from "@/components/OrderForm";

export default async function OrderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signup");
  }

  const { data: page } = await supabase
    .from("tribute_pages")
    .select("full_name")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-evergreen-950">
      <SiteHeader />
      <section className="bg-cream-50 py-16">
        <div className="container-page max-w-2xl">
          <p className="heading-caps text-evergreen-700">Order</p>
          <h1 className="mt-2 font-serif text-3xl text-evergreen-950">Order your plaque</h1>
          <p className="mt-2 text-evergreen-900/75">
            {page?.full_name
              ? `For ${page.full_name}'s tribute page. Most people order more than one — a spare, or one for another family member's visit.`
              : "Most people order more than one plaque — a spare, or one for another family member's visit."}
          </p>

          <OrderForm />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
