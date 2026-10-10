"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { WA_TEMPLATES } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { ProductDoc } from "@/types";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name (A-Z)" },
  { value: "newest", label: "Newest" },
] as const;

const PAGE_SIZE = 12;

export function ProductBrowser({
  initialItems,
  initialTotal,
  initialQuery = "",
  initialCategory = "",
  categories,
  whatsappNumber,
}: {
  initialItems: ProductDoc[];
  initialTotal: number;
  initialQuery?: string;
  initialCategory?: string;
  categories: { name: string; slug: string }[];
  whatsappNumber: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("featured");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          sort,
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (q.trim()) params.set("q", q.trim());
        if (category) params.set("category", category);
        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (json?.ok) {
          setItems(json.data.items);
          setTotal(json.data.total);
        } else {
          setItems([]);
          setTotal(0);
        }
      } catch {
        // aborted
      } finally {
        setLoading(false);
      }
    }, q ? 280 : 0);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [q, category, sort, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = q.trim().length > 0 || category !== "" || sort !== "featured";

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search products..."
            aria-label="Search products"
            className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="category-filter" className="sr-only">
            Filter by category
          </label>
          <select
            id="category-filter"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-forest outline-none transition focus:border-brand"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted" />
            <label htmlFor="sort" className="sr-only">
              Sort products
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as typeof sort);
                setPage(1);
              }}
              className="h-11 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-forest outline-none transition focus:border-brand"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-1 text-sm text-muted">
        <span>{loading ? "Loading..." : `${total} item${total === 1 ? "" : "s"}`}</span>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCategory("");
              setSort("featured");
              setPage(1);
            }}
            className="font-semibold text-deep hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length ? (
          <ProductGrid products={items} whatsappNumber={whatsappNumber} priorityCount={4} />
        ) : (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title={q ? `No matches for "${q}"` : "No products found"}
            description="Try a different search or clear the filters. You can also ask us directly on WhatsApp."
            action={
              <WhatsAppLink message={WA_TEMPLATES.general} number={whatsappNumber}>
                Enquire on WhatsApp
              </WhatsAppLink>
            }
          />
        )}
      </div>

      {totalPages > 1 && !loading && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:bg-pale disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={cn(
                "h-10 w-10 rounded-full text-sm font-bold transition",
                page === i + 1
                  ? "bg-brand text-white"
                  : "border border-line bg-white text-forest hover:bg-pale"
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:bg-pale disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
