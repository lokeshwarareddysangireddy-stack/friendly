"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  DangerButton,
  Label,
  Panel,
  Toggle,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";
import { formatINR } from "@/lib/utils";
import type { DeliveryZoneDoc } from "@/types";

interface FormState {
  _id?: string;
  name: string;
  zoneCode: string;
  city: string;
  locality: string;
  pincodes: string;
  deliveryCharge: string;
  minOrderValue: string;
  freeDeliveryThreshold: string;
  etaText: string;
  active: boolean;
  notes: string;
}

const EMPTY: FormState = {
  name: "",
  zoneCode: "",
  city: "",
  locality: "",
  pincodes: "",
  deliveryCharge: "0",
  minOrderValue: "",
  freeDeliveryThreshold: "",
  etaText: "",
  active: true,
  notes: "",
};

export function ZonesManager({ initialItems }: { initialItems: DeliveryZoneDoc[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/zones");
    const json = await res.json();
    if (json?.ok) setItems(json.data.items);
  };

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const openEdit = (z: DeliveryZoneDoc) =>
    setForm({
      _id: z._id,
      name: z.name,
      zoneCode: z.zoneCode,
      city: z.city || "",
      locality: z.locality || "",
      pincodes: z.pincodes.join(", "),
      deliveryCharge: String(z.deliveryCharge / 100),
      minOrderValue: z.minOrderValue != null ? String(z.minOrderValue / 100) : "",
      freeDeliveryThreshold:
        z.freeDeliveryThreshold != null
          ? String(z.freeDeliveryThreshold / 100)
          : "",
      etaText: z.etaText || "",
      active: z.active,
      notes: z.notes || "",
    });

  const save = async () => {
    if (!form) return;
    const pincodes = form.pincodes
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (form.name.trim().length < 2 || !form.zoneCode.trim()) {
      toast("Enter a zone name and code", "error");
      return;
    }
    if (pincodes.length === 0) {
      toast("Add at least one pincode", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      zoneCode: form.zoneCode,
      city: form.city,
      locality: form.locality,
      pincodes,
      deliveryCharge: Number(form.deliveryCharge) || 0,
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
      freeDeliveryThreshold: form.freeDeliveryThreshold
        ? Number(form.freeDeliveryThreshold)
        : null,
      etaText: form.etaText,
      active: form.active,
      notes: form.notes,
    };
    try {
      const res = await fetch(
        form._id ? `/api/admin/zones/${form._id}` : "/api/admin/zones",
        {
          method: form._id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (json?.ok) {
        toast(form._id ? "Zone updated" : "Zone created");
        setForm(null);
        load();
      } else {
        toast(json?.error || "Save failed", "error");
      }
    } catch {
      toast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (z: DeliveryZoneDoc) => {
    if (!window.confirm(`Delete zone "${z.name}"?`)) return;
    const res = await fetch(`/api/admin/zones/${z._id}`, { method: "DELETE" });
    const json = await res.json();
    if (json?.ok) {
      toast("Zone deleted");
      load();
    } else toast(json?.error || "Delete failed", "error");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-3">
        {items.map((z) => (
          <div key={z._id} className="rounded-3xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-forest">
                  {z.name}{" "}
                  <span className="text-xs font-bold text-muted">({z.zoneCode})</span>
                </p>
                <p className="text-xs text-muted">
                  {z.city || "—"} · {z.pincodes.length} pincodes
                </p>
                <p className="mt-2 text-xs text-muted">
                  Delivery {formatINR(z.deliveryCharge)}
                  {z.minOrderValue != null
                    ? ` · Min ${formatINR(z.minOrderValue)}`
                    : ""}
                  {z.freeDeliveryThreshold != null
                    ? ` · Free above ${formatINR(z.freeDeliveryThreshold)}`
                    : ""}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {z.etaText || "No ETA set"}
                </p>
                {!z.active && (
                  <span className="mt-2 inline-block rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => openEdit(z)}
                  aria-label={`Edit ${z.name}`}
                  className="rounded-full p-2 text-muted transition hover:bg-pale hover:text-forest"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <DangerButton onClick={() => remove(z)}>
                  <Trash2 className="h-4 w-4" />
                </DangerButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="lg:sticky lg:top-6 lg:h-fit">
        {form ? (
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold text-forest">
                {form._id ? "Edit zone" : "New zone"}
              </h2>
              <button
                type="button"
                onClick={() => setForm(null)}
                aria-label="Close form"
                className="rounded-full p-1.5 text-muted hover:bg-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="z-name">Zone name</Label>
                  <input
                    id="z-name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="z-code">Zone code</Label>
                  <input
                    id="z-code"
                    value={form.zoneCode}
                    onChange={(e) => set("zoneCode", e.target.value.toUpperCase())}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="z-city">City</Label>
                  <input
                    id="z-city"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="z-loc">Locality</Label>
                  <input
                    id="z-loc"
                    value={form.locality}
                    onChange={(e) => set("locality", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="z-pin">Pincodes (comma or space separated)</Label>
                <textarea
                  id="z-pin"
                  value={form.pincodes}
                  onChange={(e) => set("pincodes", e.target.value)}
                  rows={2}
                  placeholder="500001, 500002, 500003"
                  className={textareaClass}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="z-charge">Delivery (₹)</Label>
                  <input
                    id="z-charge"
                    value={form.deliveryCharge}
                    inputMode="decimal"
                    onChange={(e) => set("deliveryCharge", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="z-min">Min order (₹)</Label>
                  <input
                    id="z-min"
                    value={form.minOrderValue}
                    inputMode="decimal"
                    onChange={(e) => set("minOrderValue", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="z-free">Free above (₹)</Label>
                  <input
                    id="z-free"
                    value={form.freeDeliveryThreshold}
                    inputMode="decimal"
                    onChange={(e) => set("freeDeliveryThreshold", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="z-eta">ETA text</Label>
                <input
                  id="z-eta"
                  value={form.etaText}
                  onChange={(e) => set("etaText", e.target.value)}
                  placeholder="45 - 60 minutes"
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="z-notes">Notes</Label>
                <textarea
                  id="z-notes"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                  className={textareaClass}
                />
              </div>
              <Toggle
                label="Active"
                checked={form.active}
                onChange={(v) => set("active", v)}
              />
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {form._id ? "Save changes" : "Create zone"}
              </button>
            </div>
          </Panel>
        ) : (
          <Panel>
            <h2 className="font-display text-lg font-extrabold text-forest">
              Add a delivery zone
            </h2>
            <p className="mt-1 text-sm text-muted">
              Zones decide delivery charges based on customer pincode.
            </p>
            <button
              type="button"
              onClick={() => setForm({ ...EMPTY })}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-white transition hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              New zone
            </button>
          </Panel>
        )}
      </div>
    </div>
  );
}
