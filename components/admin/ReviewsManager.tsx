"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Check, Star, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { DangerButton, Panel } from "@/components/admin/ui";
import { cn, formatDateTime } from "@/lib/utils";
import type { ReviewDoc, ReviewStatus } from "@/types";

const FILTERS = ["all", "pending", "approved", "rejected"] as const;
type Filter = (typeof FILTERS)[number];

export function ReviewsManager({ initialItems }: { initialItems: ReviewDoc[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>("all");

  const load = async (next: Filter) => {
    const params = new URLSearchParams();
    if (next !== "all") params.set("status", next);
    const res = await fetch(`/api/admin/reviews?${params.toString()}`);
    const json = await res.json();
    if (json?.ok) setItems(json.data.items);
  };

  const setStatus = async (id: string, status: ReviewStatus) => {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json?.ok) {
      setItems((prev) => prev.map((r) => (r._id === id ? json.data : r)));
      toast(`Review ${status}`);
    } else toast(json?.error || "Update failed", "error");
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this review permanently?")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json?.ok) {
      setItems((prev) => prev.filter((r) => r._id !== id));
      toast("Review deleted");
    } else toast(json?.error || "Delete failed", "error");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFilter(f);
              void load(f);
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold capitalize transition",
              filter === f
                ? "bg-brand text-white"
                : "border border-line bg-white text-forest hover:bg-pale"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {items.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-white px-4 py-12 text-center text-sm text-muted">
            No reviews found.
          </p>
        ) : (
          items.map((r) => (
            <Panel key={r._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/product/${r.productSlug}`}
                      target="_blank"
                      className="font-display text-base font-bold text-forest hover:text-brand"
                    >
                      {r.productName}
                    </Link>
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        <BadgeCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold capitalize",
                        r.status === "approved" && "bg-emerald-50 text-emerald-700",
                        r.status === "pending" && "bg-amber-50 text-amber-700",
                        r.status === "rejected" && "bg-red-50 text-red-600"
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < r.rating ? "fill-gold text-gold" : "fill-line text-line"
                        )}
                      />
                    ))}
                    <span className="text-xs text-muted">
                      {r.customerName} · {r.customerEmail} · {formatDateTime(r.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => setStatus(r._id, "approved")}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => setStatus(r._id, "rejected")}
                      className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-forest hover:bg-pale"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  )}
                  <DangerButton onClick={() => remove(r._id)}>
                    <Trash2 className="h-4 w-4" />
                  </DangerButton>
                </div>
              </div>
              {r.title && (
                <p className="mt-3 text-sm font-bold text-forest">{r.title}</p>
              )}
              <p className="mt-2 rounded-2xl bg-surface px-4 py-3 text-sm text-ink">
                {r.comment}
              </p>
            </Panel>
          ))
        )}
      </div>
    </div>
  );
}
