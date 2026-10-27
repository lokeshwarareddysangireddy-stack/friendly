"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ProductImage } from "@/components/ui/ProductImage";
import {
  DangerButton,
  Label,
  Panel,
  inputClass,
  selectClass,
  textareaClass,
  Toggle,
} from "@/components/admin/ui";
import { formatINR } from "@/lib/utils";
import type { CategoryDoc, OrderingMethod, ProductDoc } from "@/types";
import { GROCERY_CATEGORIES, GROCERY_SLUG, GROCERY_TAGS, GROCERY_ALIASES, OTHER_GROCERY, groceryGroup } from "@/lib/grocery-categories";

interface FormState {
  tags: string[];
  _id?: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price: string;
  mrp: string;
  unit: string;
  sku: string;
  orderingMethod: OrderingMethod;
  requiresPrescription: boolean;
  available: boolean;
  trackStock: boolean;
  stockQty: string;
  featured: boolean;
  active: boolean;
  imageUrl: string;
}

const EMPTY: FormState = {
  tags: [],
  name: "",
  slug: "",
  categoryId: "",
  description: "",
  price: "",
  mrp: "",
  unit: "",
  sku: "",
  orderingMethod: "both",
  requiresPrescription: false,
  available: true,
  trackStock: false,
  stockQty: "",
  featured: false,
  active: true,
  imageUrl: "",
};

function toForm(p: ProductDoc): FormState {
  return {
    tags: p.tags || [],
    _id: p._id,
    name: p.name,
    slug: p.slug,
    categoryId: p.categoryId,
    description: p.description,
    price: String(p.price / 100),
    mrp: p.mrp != null ? String(p.mrp / 100) : "",
    unit: p.unit || "",
    sku: p.sku || "",
    orderingMethod: p.orderingMethod,
    requiresPrescription: Boolean(p.requiresPrescription),
    available: p.available,
    trackStock: p.trackStock,
    stockQty: p.stockQty != null ? String(p.stockQty) : "",
    featured: p.featured,
    active: p.active,
    imageUrl: p.images?.[0]?.url || "",
  };
}

export function ProductsManager({
  initialItems,
  initialTotal,
  categories,
}: {
  initialItems: ProductDoc[];
  initialTotal: number;
  categories: CategoryDoc[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const first = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (q.trim()) params.set("q", q.trim());
      if (category) params.set("category", category);
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const json = await res.json();
      if (json?.ok) {
        setItems(json.data.items);
        setTotal(json.data.total);
      }
    } catch {
      toast("Could not load products", "error");
    } finally {
      setLoading(false);
    }
  }, [q, category, toast]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const set = (key: keyof FormState, value: string | boolean | string[]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  };

  const openCreate = () =>
    setForm({ ...EMPTY, categoryId: categories[0]?._id || "" });

  const save = async () => {
    if (!form) return;
    if (form.name.trim().length < 2) {
      toast("Enter a product name", "error");
      return;
    }
    if (!form.categoryId) {
      toast("Select a category", "error");
      return;
    }
    if (!form.price || Number(form.price) < 0) {
      toast("Enter a valid price", "error");
      return;
    }
    setSaving(true);
    const payload = {
      tags: form.tags,
      name: form.name,
      slug: form.slug || undefined,
      categoryId: form.categoryId,
      description: form.description,
      price: Number(form.price),
      mrp: form.mrp ? Number(form.mrp) : null,
      unit: form.unit,
      sku: form.sku,
      orderingMethod: form.orderingMethod,
      requiresPrescription: form.requiresPrescription,
      available: form.available,
      trackStock: form.trackStock,
      stockQty: form.trackStock && form.stockQty ? Number(form.stockQty) : null,
      featured: form.featured,
      active: form.active,
      images: form.imageUrl ? [{ url: form.imageUrl }] : [],
    };
    try {
      const res = await fetch(
        form._id ? `/api/admin/products/${form._id}` : "/api/admin/products",
        {
          method: form._id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (json?.ok) {
        toast(form._id ? "Product updated" : "Product created");
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

  const remove = async (product: ProductDoc) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/products/${product._id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json?.ok) {
      toast("Product deleted");
      load();
    } else {
      toast(json?.error || "Delete failed", "error");
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const json = await res.json();
      if (json?.ok) set("imageUrl", json.data.url);
      else toast(json?.error || "Upload failed", "error");
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products"
              className="h-11 w-full rounded-2xl border border-line bg-surface pl-10 pr-4 text-sm outline-none transition focus:border-brand focus:bg-white"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${selectClass} sm:w-52`}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between px-1 text-sm text-muted">
          <span className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {total} product{total === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((p) => (
            <div
              key={p._id}
              className="flex gap-3 rounded-3xl border border-line bg-white p-3"
            >
              <ProductImage
                src={p.images?.[0]?.url}
                alt={p.name}
                seed={p.slug}
                className="h-16 w-16 shrink-0"
                sizes="64px"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-forest">{p.name}</p>
                    <p className="truncate text-xs text-muted">
                      {p.categorySlug} · {p.unit || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => setForm(toForm(p))}
                      aria-label={`Edit ${p.name}`}
                      className="rounded-full p-2 text-muted transition hover:bg-pale hover:text-forest"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <DangerButton onClick={() => remove(p)}>
                      <Trash2 className="h-4 w-4" />
                    </DangerButton>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-forest">{formatINR(p.price)}</span>
                  {!p.active && (
                    <span className="rounded-full bg-surface px-2 py-0.5 font-bold text-muted">
                      Inactive
                    </span>
                  )}
                  {p.featured && (
                    <span className="rounded-full bg-pale px-2 py-0.5 font-bold text-deep">
                      Featured
                    </span>
                  )}
                  {!p.available && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-700">
                      Unavailable
                    </span>
                  )}
                  {p.orderingMethod !== "online" && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                      {p.orderingMethod}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <p className="rounded-3xl border border-dashed border-line bg-white px-4 py-12 text-center text-sm text-muted">
              No products found.
            </p>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:h-fit">
        {form ? (
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold text-forest">
                {form._id ? "Edit product" : "New product"}
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
                <Label htmlFor="p-name">Name</Label>
                <input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="p-cat">Category</Label>
                <select
                  id="p-cat"
                  value={form.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {categories.find((category) => category._id === form.categoryId)?.slug === GROCERY_SLUG && (
                  <div className="mb-3">
                    <Label htmlFor="p-grocery-group">Grocery category</Label>
                    <select id="p-grocery-group" value={groceryGroup(form.tags)} className={selectClass}
                      onChange={(event) => {
                        const groupingTags = [...GROCERY_TAGS, ...Object.values(GROCERY_ALIASES).flat(), OTHER_GROCERY.tag];
                        set("tags", [...form.tags.filter((tag) => !groupingTags.includes(tag)), event.target.value]);
                      }}>
                      {[...GROCERY_CATEGORIES, OTHER_GROCERY].map((category) => <option key={category.tag} value={category.tag}>{category.name}</option>)}
                    </select>
                  </div>
                )}
                <Label htmlFor="p-desc">Description</Label>
                <textarea
                  id="p-desc"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  className={textareaClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="p-price">Price (₹)</Label>
                  <input
                    id="p-price"
                    value={form.price}
                    inputMode="decimal"
                    onChange={(e) => set("price", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="p-mrp">MRP (₹)</Label>
                  <input
                    id="p-mrp"
                    value={form.mrp}
                    inputMode="decimal"
                    onChange={(e) => set("mrp", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="p-unit">Unit</Label>
                  <input
                    id="p-unit"
                    value={form.unit}
                    onChange={(e) => set("unit", e.target.value)}
                    placeholder="e.g. 1 kg"
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="p-sku">SKU</Label>
                  <input
                    id="p-sku"
                    value={form.sku}
                    onChange={(e) => set("sku", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="p-order">Ordering method</Label>
                <select
                  id="p-order"
                  value={form.orderingMethod}
                  onChange={(e) =>
                    set("orderingMethod", e.target.value as OrderingMethod)
                  }
                  className={selectClass}
                >
                  <option value="online">Online only</option>
                  <option value="both">Online + enquiry</option>
                  <option value="enquiry">Enquiry only</option>
                </select>
              </div>

              <div>
                <Label htmlFor="p-img">Image URL</Label>
                <input
                  id="p-img"
                  value={form.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-deep hover:underline">
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void upload(file);
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Toggle
                  label="Available"
                  checked={form.available}
                  onChange={(v) => set("available", v)}
                />
                <Toggle
                  label="Featured"
                  checked={form.featured}
                  onChange={(v) => set("featured", v)}
                />
                <Toggle
                  label="Track stock"
                  checked={form.trackStock}
                  onChange={(v) => set("trackStock", v)}
                />
                <Toggle
                  label="Active"
                  checked={form.active}
                  onChange={(v) => set("active", v)}
                />
              </div>
              <Toggle
                label="Requires prescription"
                checked={form.requiresPrescription}
                onChange={(v) => set("requiresPrescription", v)}
              />
              {form.trackStock && (
                <div>
                  <Label htmlFor="p-stock">Stock quantity</Label>
                  <input
                    id="p-stock"
                    value={form.stockQty}
                    inputMode="numeric"
                    onChange={(e) =>
                      set("stockQty", e.target.value.replace(/\D/g, ""))
                    }
                    className={inputClass}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {form._id ? "Save changes" : "Create product"}
                </button>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel>
            <h2 className="font-display text-lg font-extrabold text-forest">
              Add a product
            </h2>
            <p className="mt-1 text-sm text-muted">
              Create a new catalog item and choose how it can be ordered.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-white transition hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              New product
            </button>
          </Panel>
        )}
      </div>
    </div>
  );
}
