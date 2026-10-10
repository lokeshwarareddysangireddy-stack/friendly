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
  selectClass,
  textareaClass,
} from "@/components/admin/ui";
import type { PromotionDoc } from "@/types";

interface FormState {
  _id?: string;
  title: string;
  message: string;
  kind: PromotionDoc["kind"];
  sortOrder: string;
  active: boolean;
}

const EMPTY: FormState = {
  title: "",
  message: "",
  kind: "announcement",
  sortOrder: "0",
  active: true,
};

export function PromotionsManager({
  initialItems,
}: {
  initialItems: PromotionDoc[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/promotions");
    const json = await res.json();
    if (json?.ok) setItems(json.data.items);
  };

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = async () => {
    if (!form) return;
    if (form.title.trim().length < 2 || form.message.trim().length < 2) {
      toast("Enter a title and message", "error");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      message: form.message,
      kind: form.kind,
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
    };
    try {
      const res = await fetch(
        form._id ? `/api/admin/promotions/${form._id}` : "/api/admin/promotions",
        {
          method: form._id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (json?.ok) {
        toast(form._id ? "Promotion updated" : "Promotion created");
        setForm(null);
        load();
      } else toast(json?.error || "Save failed", "error");
    } catch {
      toast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: PromotionDoc) => {
    if (!window.confirm("Delete this promotion?")) return;
    const res = await fetch(`/api/admin/promotions/${p._id}`, { method: "DELETE" });
    const json = await res.json();
    if (json?.ok) {
      toast("Promotion deleted");
      load();
    } else toast(json?.error || "Delete failed", "error");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p._id} className="rounded-3xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-forest">{p.title}</p>
                <p className="mt-1 text-xs text-muted">{p.message}</p>
                <p className="mt-1 text-xs text-muted">
                  {p.kind} · sort {p.sortOrder}
                  {!p.active && " · inactive"}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      _id: p._id,
                      title: p.title,
                      message: p.message,
                      kind: p.kind,
                      sortOrder: String(p.sortOrder),
                      active: p.active,
                    })
                  }
                  aria-label="Edit promotion"
                  className="rounded-full p-2 text-muted transition hover:bg-pale hover:text-forest"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <DangerButton onClick={() => remove(p)}>
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
                {form._id ? "Edit promotion" : "New promotion"}
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
              <div>
                <Label htmlFor="pr-title">Title</Label>
                <input
                  id="pr-title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="pr-msg">Message</Label>
                <textarea
                  id="pr-msg"
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  rows={3}
                  className={textareaClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pr-kind">Kind</Label>
                  <select
                    id="pr-kind"
                    value={form.kind}
                    onChange={(e) =>
                      set("kind", e.target.value as PromotionDoc["kind"])
                    }
                    className={selectClass}
                  >
                    <option value="announcement">Announcement</option>
                    <option value="banner">Banner</option>
                    <option value="feature">Feature</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="pr-sort">Sort order</Label>
                  <input
                    id="pr-sort"
                    value={form.sortOrder}
                    inputMode="numeric"
                    onChange={(e) =>
                      set("sortOrder", e.target.value.replace(/\D/g, ""))
                    }
                    className={inputClass}
                  />
                </div>
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
                {form._id ? "Save changes" : "Create promotion"}
              </button>
            </div>
          </Panel>
        ) : (
          <Panel>
            <h2 className="font-display text-lg font-extrabold text-forest">
              Add a promotion
            </h2>
            <p className="mt-1 text-sm text-muted">
              Announcements and banners shown on the storefront.
            </p>
            <button
              type="button"
              onClick={() => setForm({ ...EMPTY })}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-white transition hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              New promotion
            </button>
          </Panel>
        )}
      </div>
    </div>
  );
}
