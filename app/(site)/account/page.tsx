"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";
import { useCustomer } from "@/components/auth/customer-context";
import { useWishlist } from "@/components/wishlist/wishlist-context";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { formatINR, formatDate } from "@/lib/utils";
import type { OrderDoc } from "@/types";

export default function AccountOverviewPage() {
  const { customer } = useCustomer();
  const { count: wishCount } = useWishlist();
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/orders", { cache: "no-store" });
        const json = await res.json();
        if (active) setOrders(json?.data?.orders ?? []);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = [
    { label: "Orders", value: orders.length, href: "/account/orders", icon: Package },
    { label: "Wishlist", value: wishCount, href: "/wishlist", icon: Heart },
    {
      label: "Addresses",
      value: customer?.addresses.length ?? 0,
      href: "/account/addresses",
      icon: MapPin,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-forest">
          Hello, {customer?.name?.split(" ")[0] || "there"}!
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage your orders, wishlist and delivery details in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-3xl border border-line bg-white p-5 transition hover:border-brand/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pale text-deep">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted" />
              </div>
              <p className="mt-4 text-3xl font-extrabold text-forest">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-forest">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-deep hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-muted">Loading your orders…</p>
        ) : orders.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-line bg-surface/50 px-5 py-8 text-center">
            <p className="text-sm text-muted">You have not placed any orders yet.</p>
            <Link
              href="/services"
              className="mt-3 inline-block rounded-full bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-600"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {orders.slice(0, 4).map((o) => (
              <li key={o.orderId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/account/orders/${o.orderId}`}
                    className="text-sm font-bold text-forest hover:text-deep"
                  >
                    {o.orderId}
                  </Link>
                  <p className="text-xs text-muted">
                    {formatDate(o.createdAt)} · {o.items.length} item(s) · {formatINR(o.total)}
                  </p>
                </div>
                <OrderStatusBadge status={o.fulfilmentStatus} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
