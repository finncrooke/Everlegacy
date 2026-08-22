import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { generateQrDataUrl, tributeUrl } from "@/lib/qrcode";
import { OrderStatusSelect } from "@/components/OrderStatusSelect";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }
  if (!isAdminEmail(user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8 text-center text-gray-900">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold">You don&apos;t have access to this page</h1>
          <p className="mt-2 text-gray-600">
            {user.email} isn&apos;t an admin account. If you think this is a mistake, contact support.
          </p>
        </div>
      </div>
    );
  }

  const admin = createServiceRoleClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, created_at, customer_email, shipping_name, status, tribute_page_id")
    .order("created_at", { ascending: false });

  const { data: pages } = await admin.from("tribute_pages").select("id, slug, full_name");
  const pageById = new Map((pages ?? []).map((p: any) => [p.id, p]));

  const rows = await Promise.all(
    (orders ?? []).map(async (order: any) => {
      const page = order.tribute_page_id ? pageById.get(order.tribute_page_id) : null;
      const qr = page ? await generateQrDataUrl(tributeUrl(page.slug)) : null;
      return { order, page, qr };
    })
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <SignOutButton />
        </div>

        <div className="overflow-x-auto rounded border border-gray-300 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Order date</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Tribute page</th>
                <th className="px-4 py-3 text-left font-medium">QR code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map(({ order, page, qr }) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.shipping_name}</div>
                    <div className="text-gray-500">{order.customer_email}</div>
                  </td>
                  <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3">
                    <OrderStatusSelect orderId={order.id} initialStatus={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    {page ? (
                      <a
                        href={tributeUrl(page.slug)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline"
                      >
                        {page.full_name || page.slug}
                      </a>
                    ) : (
                      <span className="text-gray-400">Not created yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {qr ? (
                      <a href={qr} download={`everlegacy-qr-${page?.slug}.png`} className="text-blue-700 underline">
                        Download QR
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {(orders ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
