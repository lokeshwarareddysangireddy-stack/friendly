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
import type { CategoryDoc, OrderingMethod } from "@/types";

interface FormState {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: string;
  active: boolean;
  orderingMethod: OrderingMethod;
  highlights: string;
  imageUrl: string;
}

const EMPTY: FormState = {
  name: "",
  slug: "",
  description: "",
  sortOrder: "0",
  active: true,
  orderingMethod: "both",
  highlights: "",
  imageUrl: "",
};

export function CategoriesManager({
  initialItems,
}: {
  initialItems: CategoryDoc[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/categories");
    const json = await res.json();
    if (json?.ok) setItems(json.data.items);
  };

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const openEdit = (c: CategoryDoc) =>
    setForm({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      sortOrder: String(c.sortOrder),
      active: c.active,
      orderingMethod: c.orderingMethod,
      highlights: (c.highlights || []).join(", "),
      imageUrl: c.image?.url || "",
    });

  const save = async () => {
    if (!form) return;
    if (form.name.trim().length < 2) {
      toast("Enter a category name", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description,
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
      orderingMethod: form.orderingMethod,
      highlights: form.highlights
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean),
      image: form.imageUrl ? { url: form.imageUrl } : null,
    };
    try {
      const res = await fetch(
        form._id ? `/api/admin/categories/${form._id}` : "/api/admin/categories",
        {
          method: form._id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (json?.ok) {
        toast(form._id ? "Category updated" : "Category created");
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

  const remove = async (c: CategoryDoc) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    const res = await fetch(`/api/admin/categories/${c._id}`, { method: "DELETE" });
    const json = await res.json();
    if (json?.ok) {
      toast("Category deleted");
      load();
    } else toast(json?.error || "Delete failed", "error");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-3">
        {items.map((c) => (
          <div
            key={c._id}
            className="flex items-start justify-between gap-3 rounded-3xl border border-line bg-white p-4"
          >
            <div className="min-w-0">
              <p className="font-semibold text-forest">{c.name}</p>
              <p className="truncate text-xs text-muted">
                /services/{c.slug} · sort {c.sortOrder} · {c.orderingMethod}
              </p>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted">
                  {c.description}
                </p>
              )}
              {!c.active && (
                <span className="mt-2 inline-block rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => openEdit(c)}
                aria-label={`Edit ${c.name}`}
                className="rounded-full p-2 text-muted transition hover:bg-pale hover:text-forest"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <DangerButton onClick={() => remove(c)}>
                <Trash2 className="h-4 w-4" />
              </DangerButton>
            </div>
          </div>
        ))}
      </div>

      <div className="lg:sticky lg:top-6 lg:h-fit">
        {form ? (
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold text-forest">
                {form._id ? "Edit category" : "New category"}
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
                <Label htmlFor="c-name">Name</Label>
                <input
                  id="c-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="c-desc">Description</Label>
                <textarea
                  id="c-desc"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  className={textareaClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="c-sort">Sort order</Label>
                  <input
                    id="c-sort"
                    value={form.sortOrder}
                    inputMode="numeric"
                    onChange={(e) =>
                      set("sortOrder", e.target.value.replace(/\D/g, ""))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="c-order">Ordering</Label>
                  <select
                    id="c-order"
                    value={form.orderingMethod}
                    onChange={(e) =>
                      set("orderingMethod", e.target.value as OrderingMethod)
                    }
                    className={selectClass}
                  >
                    <option value="online">Online</option>
                    <option value="both">Both</option>
                    <option value="enquiry">Enquiry</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="c-high">Highlights (comma separated)</Label>
                <input
                  id="c-high"
                  value={form.highlights}
                  onChange={(e) => set("highlights", e.target.value)}
                  placeholder="Pizzas, Burgers, Shakes"
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="c-img">Image URL</Label>
                <input
                  id="c-img"
                  value={form.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  className={inputClass}
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
                {form._id ? "Save changes" : "Create category"}
              </button>
            </div>
          </Panel>
        ) : (
          <Panel>
            <h2 className="font-display text-lg font-extrabold text-forest">
              Add a category
            </h2>
            <p className="mt-1 text-sm text-muted">
              Categories appear as service pages and navigation entries.
            </p>
            <button
              type="button"
              onClick={() => setForm({ ...EMPTY })}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-white transition hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              New category
            </button>
          </Panel>
        )}
      </div>
    </div>
  );
}
