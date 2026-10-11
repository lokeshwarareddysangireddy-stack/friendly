"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { selectClass } from "@/components/admin/ui";
import { formatDateTime, formatINR } from "@/lib/utils";
import type { OrderDoc, OrderFulfilmentStatus, OrderPaymentStatus } from "@/types";

const PAYMENT: OrderPaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "refund_pending",
  "refunded",
];

const FULFILMENT: OrderFulfilmentStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export function OrdersManager({
  initialItems,
  initialTotal,
}: {
  initialItems: OrderDoc[];
  initialTotal: number;
}) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [q, setQ] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [fulfilmentStatus, setFulfilmentStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const first = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (q.trim()) params.set("q", q.trim());
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      if (fulfilmentStatus) params.set("fulfilmentStatus", fulfilmentStatus);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const json = await res.json();
      if (json?.ok) {
        setItems(json.data.items);
        setTotal(json.data.total);
      }
    } catch {
      toast("Could not load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [q, paymentStatus, fulfilmentStatus, toast]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const update = async (
    orderId: string,
    patch: Record<string, string>
  ) => {
    setSavingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (json?.ok) {
        setItems((prev) =>
          prev.map((o) => (o.orderId === orderId ? json.data : o))
        );
        toast(`Order ${orderId} updated`);
      } else {
        toast(json?.error || "Update failed", "error");
      }
    } catch {
      toast("Update failed", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order ID, name or mobile"
            className="h-11 w-full rounded-2xl border border-line bg-surface pl-10 pr-4 text-sm outline-none transition focus:border-brand focus:bg-white"
          />
        </div>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className={`${selectClass} lg:w-44`}
          aria-label="Filter by payment status"
        >
          <option value="">All payments</option>
          {PAYMENT.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={fulfilmentStatus}
          onChange={(e) => setFulfilmentStatus(e.target.value)}
          className={`${selectClass} lg:w-48`}
          aria-label="Filter by fulfilment status"
        >
          <option value="">All fulfilment</option>
          {FULFILMENT.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex items-center gap-2 px-1 text-sm text-muted">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        <span>{total} order{total === 1 ? "" : "s"}</span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-surface/70">
            <tr className="text-xs font-bold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfilment</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  No orders found.
                </td>
              </tr>
            ) : (
              items.map((o) => (
                <tr key={o._id} className="align-top">
                  <td className="px-4 py-3">
                    <span className="font-bold text-forest">{o.orderId}</span>
                    <span className="mt-0.5 block text-xs capitalize text-muted">
                      {o.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <span className="font-semibold text-forest">
                      {o.customer.name}
                    </span>
                    <span className="block text-xs">{o.customer.mobile}</span>
                    <span className="block text-xs">
                      {o.customer.area
                        ? o.customer.area + (o.customer.landmark ? ` — ${o.customer.landmark}` : "")
                        : [o.customer.city, o.customer.pincode].filter(Boolean).join(" — ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {o.items.reduce((n, i) => n + i.quantity, 0)}
                    <span className="block text-xs">{o.items.length} lines</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-forest">
                    {formatINR(o.total)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.paymentStatus}
                      disabled={savingId === o.orderId}
                      onChange={(e) =>
                        update(o.orderId, { paymentStatus: e.target.value })
                      }
                      className="h-9 rounded-xl border border-line bg-white px-2 text-xs font-semibold capitalize outline-none focus:border-brand"
                    >
                      {PAYMENT.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.fulfilmentStatus}
                      disabled={savingId === o.orderId}
                      onChange={(e) =>
                        update(o.orderId, { fulfilmentStatus: e.target.value })
                      }
                      className="h-9 rounded-xl border border-line bg-white px-2 text-xs font-semibold capitalize outline-none focus:border-brand"
                    >
                      {FULFILMENT.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {formatDateTime(o.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
