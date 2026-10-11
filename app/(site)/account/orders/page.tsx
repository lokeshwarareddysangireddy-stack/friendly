"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/account/OrderStatusBadge";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatINR, formatDateTime } from "@/lib/utils";
import type { OrderDoc } from "@/types";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/orders", { cache: "no-store" });
        const json = await res.json();
        if (active) setOrders(json?.data?.orders ?? []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-forest">My Orders</h1>
        <p className="mt-1 text-sm text-muted">Every order you have placed with Friendly Basket.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <PackageSearch className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-sm text-muted">No orders yet.</p>
          <Link
            href="/services"
            className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.orderId} className="rounded-3xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/account/orders/${o.orderId}`}
                    className="font-display text-lg font-bold text-forest hover:text-deep"
                  >
                    {o.orderId}
                  </Link>
                  <p className="text-xs text-muted">{formatDateTime(o.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={o.fulfilmentStatus} />
                  <PaymentStatusBadge status={o.paymentStatus} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 overflow-x-auto no-scrollbar">
                {o.items.slice(0, 6).map((item) => (
                  <div key={item.productId} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line">
                    <ProductImage src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                ))}
                {o.items.length > 6 && (
                  <span className="text-xs font-semibold text-muted">+{o.items.length - 6} more</span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-forest">{formatINR(o.total)}</p>
                <div className="flex gap-2">
                  {o.fulfilmentStatus === "out_for_delivery" && o.lookupToken && (
                    <Link
                      href={`/track/${o.orderId}?token=${o.lookupToken}`}
                      className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-600"
                    >
                      Track live
                    </Link>
                  )}
                  <Link
                    href={`/account/orders/${o.orderId}`}
                    className="rounded-full border border-line px-4 py-2 text-xs font-bold text-forest hover:bg-pale"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
