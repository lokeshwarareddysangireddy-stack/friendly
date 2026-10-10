import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Package,
  FolderTree,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { AdminHeading, Panel, StatCard } from "@/components/admin/ui";
import {
  listCategories,
  listEnquiries,
  listOrders,
  listProducts,
  listZones,
} from "@/lib/db";
import { formatDateTime, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  paid: "bg-pale text-deep",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
  refund_pending: "bg-blue-50 text-blue-700",
  refunded: "bg-surface text-muted",
};

export default async function AdminDashboardPage() {
  const [ordersResult, productsResult, categories, zones, enquiries] =
    await Promise.all([
      listOrders({ limit: 100 }),
      listProducts({ includeInactive: true, limit: 1 }),
      listCategories({ includeInactive: true }),
      listZones({ includeInactive: true }),
      listEnquiries(),
    ]);

  const orders = ordersResult.items;
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.paymentStatus === "pending").length;
  const newEnquiries = enquiries.filter((e) => e.status === "new").length;
  const activeZones = zones.filter((z) => z.active).length;

  const recent = orders.slice(0, 6);

  return (
    <>
      <AdminHeading
        title="Dashboard"
        description="A snapshot of orders, catalog and delivery operations."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total orders"
          value={ordersResult.total}
          hint={`${pendingOrders} awaiting payment`}
        />
        <StatCard
          label="Paid revenue"
          value={formatINR(revenue)}
          hint={`${paidOrders.length} paid orders`}
          tone="brand"
        />
        <StatCard
          label="Products"
          value={productsResult.total}
          hint={`${categories.length} categories`}
        />
        <StatCard
          label="New enquiries"
          value={newEnquiries}
          hint={`${activeZones} active zones`}
          tone={newEnquiries > 0 ? "amber" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-forest">
              Recent orders
            </h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-sm font-bold text-deep hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-4 py-10 text-center text-sm text-muted">
              No orders yet. Orders will appear here once customers check out.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-wide text-muted">
                    <th className="pb-3">Order</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recent.map((o) => (
                    <tr key={o._id}>
                      <td className="py-3 font-semibold text-forest">{o.orderId}</td>
                      <td className="py-3 text-muted">
                        {o.customer.name}
                        <span className="block text-xs">{o.customer.pincode}</span>
                      </td>
                      <td className="py-3 font-semibold text-forest">
                        {formatINR(o.total)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                            STATUS_TONE[o.paymentStatus] || "bg-surface text-muted"
                          }`}
                        >
                          {o.paymentStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-muted">
                        {formatDateTime(o.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel>
          <h2 className="font-display text-lg font-extrabold text-forest">
            Quick links
          </h2>
          <div className="mt-4 space-y-2">
            {[
              { label: "Manage products", href: "/admin/products", icon: Package },
              { label: "Delivery zones", href: "/admin/zones", icon: MapPin },
              { label: "Categories", href: "/admin/categories", icon: FolderTree },
              { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquare },
              { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-forest transition hover:border-brand/40 hover:bg-pale"
              >
                <span className="flex items-center gap-3">
                  <link.icon className="h-4 w-4 text-deep" />
                  {link.label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted" />
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
