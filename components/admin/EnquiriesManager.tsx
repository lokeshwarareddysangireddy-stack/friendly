"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { DangerButton, Panel } from "@/components/admin/ui";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/utils";
import type { EnquiryDoc } from "@/types";

const STATUSES = ["new", "contacted", "closed"] as const;

export function EnquiriesManager({
  initialItems,
}: {
  initialItems: EnquiryDoc[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState("");

  const load = async (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/enquiries?${params.toString()}`);
    const json = await res.json();
    if (json?.ok) setItems(json.data.items);
  };

  const update = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json?.ok) {
      setItems((prev) => prev.map((e) => (e._id === id ? json.data : e)));
      toast("Enquiry updated");
    } else toast(json?.error || "Update failed", "error");
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this enquiry?")) return;
    const res = await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json?.ok) {
      setItems((prev) => prev.filter((e) => e._id !== id));
      toast("Enquiry deleted");
    } else toast(json?.error || "Delete failed", "error");
  };

  return (
    <div>
      <div className="flex gap-2">
        {["", ...STATUSES].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => {
              setFilter(s);
              load(s);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              filter === s
                ? "bg-brand text-white"
                : "border border-line bg-white text-forest hover:bg-pale"
            }`}
          >
            {s || "all"}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {items.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-white px-4 py-12 text-center text-sm text-muted">
            No enquiries found.
          </p>
        ) : (
          items.map((e) => (
            <Panel key={e._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-forest">
                    {e.name}{" "}
                    <span className="text-sm font-medium text-muted">
                      · {e.mobile}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {e.category || "General"}
                    {e.location ? ` · ${e.location}` : ""} ·{" "}
                    {formatDateTime(e.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={e.status}
                    onChange={(ev) => update(e._id, ev.target.value)}
                    className="h-9 rounded-xl border border-line bg-white px-2 text-xs font-semibold capitalize outline-none focus:border-brand"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <DangerButton onClick={() => remove(e._id)}>
                    <Trash2 className="h-4 w-4" />
                  </DangerButton>
                </div>
              </div>
              <p className="mt-3 rounded-2xl bg-surface px-4 py-3 text-sm text-ink">
                {e.items}
              </p>
              {e.instructions && (
                <p className="mt-2 text-xs text-muted">Note: {e.instructions}</p>
              )}
              <a
                href={buildWhatsAppUrl(
                  `Hi ${e.name}, regarding your Friendly Basket enquiry:`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-xs font-bold text-[#1ebe5a] hover:underline"
              >
                Reply on WhatsApp →
              </a>
            </Panel>
          ))
        )}
      </div>
    </div>
  );
}
