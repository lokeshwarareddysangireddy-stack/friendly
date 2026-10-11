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

export interface ProductFacetsProp {
  tags: { value: string; count: number }[];
  priceMin: number;
  priceMax: number;
}

export function CategoryProductBrowser({
  categorySlug,
  categoryName,
  orderingMethod,
  initialItems,
  initialTotal,
  facets,
  whatsappNumber,
}: {
  categorySlug: string;
  categoryName: string;
  orderingMethod: string;
  initialItems: ProductDoc[];
  initialTotal: number;
  facets: ProductFacetsProp;
  whatsappNumber: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("featured");
  const [page, setPage] = useState(1);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const firstRender = useRef(true);

  const tagsKey = activeTags.join(",");
  const priceActive =
    (minPrice.trim() !== "" && Number(minPrice) > 0) ||
    (maxPrice.trim() !== "" && Number(maxPrice) > 0);
  const hasFacets = facets.tags.length > 0 || facets.priceMax > facets.priceMin;

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
          category: categorySlug,
          sort,
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (q.trim()) params.set("q", q.trim());
        if (activeTags.length) params.set("tags", activeTags.join(","));
        const min = Number(minPrice);
        const max = Number(maxPrice);
        if (minPrice.trim() && Number.isFinite(min) && min > 0)
          params.set("minPrice", String(Math.round(min * 100)));
        if (maxPrice.trim() && Number.isFinite(max) && max > 0)
          params.set("maxPrice", String(Math.round(max * 100)));
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
  }, [q, sort, page, categorySlug, tagsKey, activeTags, minPrice, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = q.trim().length > 0 || sort !== "featured" || activeTags.length > 0 || priceActive;

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setQ("");
    setSort("featured");
    setActiveTags([]);
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={`Search in ${categoryName}...`}
            aria-label={`Search in ${categoryName}`}
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

      {hasFacets && (
        <div className="mt-3 flex flex-col gap-3 rounded-3xl border border-line bg-white p-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted">
              Price
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted">&#8377;</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                placeholder={String(Math.floor(facets.priceMin / 100))}
                aria-label="Minimum price"
                className="h-9 w-24 rounded-full border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
              />
              <span className="text-muted">-</span>
              <span className="text-sm text-muted">&#8377;</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                placeholder={String(Math.ceil(facets.priceMax / 100))}
                aria-label="Maximum price"
                className="h-9 w-24 rounded-full border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
              />
            </div>
          </div>

          {facets.tags.length > 0 && (
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">
                Tags
              </span>
              {facets.tags.map((t) => {
                const active = activeTags.includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleTag(t.value)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition",
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-surface text-forest hover:border-brand hover:bg-pale"
                    )}
                  >
                    {t.value}
                    <span className={cn("ml-1.5", active ? "text-white/70" : "text-muted")}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between px-1 text-sm text-muted">
        <span>
          {loading ? "Loading..." : `${total} item${total === 1 ? "" : "s"}`}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
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
          <ProductGrid
            products={items}
            whatsappNumber={whatsappNumber}
            priorityCount={4}
          />
        ) : (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title={q ? `No matches for "${q}"` : "No items available yet"}
            description={
              q
                ? "Try a different search term or clear the filters to see everything."
                : "This category is being updated. Send us a WhatsApp message and we will help with your request."
            }
            action={
              <WhatsAppLink
                message={
                  orderingMethod === "enquiry"
                    ? WA_TEMPLATES.medicine
                    : WA_TEMPLATES.general
                }
                number={whatsappNumber}
              >
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
