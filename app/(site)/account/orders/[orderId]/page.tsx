"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Radio } from "lucide-react";
import { OrderStatusBadge, PaymentStatusBadge, FULFILMENT_LABEL } from "@/components/account/OrderStatusBadge";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatINR, formatDateTime } from "@/lib/utils";
import type { OrderDoc } from "@/types";

export default function AccountOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = decodeURIComponent(String(params.orderId));
  const [order, setOrder] = useState<OrderDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/auth/orders/${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      setOrder(json?.data?.order ?? null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-muted">Loading order…</p>;
  if (!order)
    return (
      <div className="rounded-3xl border border-line bg-white p-8 text-center">
        <p className="text-sm text-muted">Order not found.</p>
        <Link href="/account/orders" className="mt-3 inline-block text-sm font-semibold text-deep hover:underline">
          Back to orders
        </Link>
      </div>
    );

  const history = order.statusHistory || [];

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-deep hover:underline">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="rounded-3xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-forest">{order.orderId}</h1>
            <p className="mt-1 text-xs text-muted">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.fulfilmentStatus} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        {order.fulfilmentStatus === "out_for_delivery" && order.lookupToken && (
          <Link
            href={`/track/${order.orderId}?token=${order.lookupToken}`}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
          >
            <Radio className="h-4 w-4 animate-pulse" /> Track live delivery
          </Link>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Items</h2>
            <ul className="mt-3 space-y-3">
              {order.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line">
                    <ProductImage src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-forest">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.quantity} × {formatINR(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-forest">{formatINR(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Delivery address</h2>
              <p className="mt-2 text-sm text-forest">
                {order.customer.name}
                <br />
                {order.customer.address}
                <br />
                {order.customer.city}, {order.customer.state} — {order.customer.pincode}
                <br />
                {order.customer.mobile}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Status timeline</h2>
              <ol className="mt-3 space-y-3">
                {history.length === 0 && (
                  <li className="text-sm text-muted">Awaiting updates.</li>
                )}
                {history.map((h, i) => (
                  <li key={`${h.at}-${i}`} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <div>
                      <p className="text-sm font-semibold text-forest">
                        {FULFILMENT_LABEL[h.status as OrderDoc["fulfilmentStatus"]] || h.status}
                      </p>
                      <p className="text-xs text-muted">{formatDateTime(h.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-1 border-t border-line pt-4 text-sm">
          <Row label="Subtotal" value={formatINR(order.subtotal)} />
          <Row label="Delivery" value={order.deliveryCharge === 0 ? "Free" : formatINR(order.deliveryCharge)} />
          {order.discount > 0 && <Row label="Discount" value={`- ${formatINR(order.discount)}`} />}
          <div className="flex items-center justify-between pt-2 text-base font-extrabold text-forest">
            <span>Total</span>
            <span>{formatINR(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted">
      <span>{label}</span>
      <span className="font-semibold text-forest">{value}</span>
    </div>
  );
}
