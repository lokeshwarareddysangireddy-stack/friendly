import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, ShoppingBasket } from "lucide-react";
import { listProducts } from "@/lib/db";
import { GROCERY_SLUG } from "@/lib/grocery-categories";
import type { GroceryCategory } from "@/lib/grocery-categories";
import { ProductCard } from "@/components/products/ProductCard";
import { getSettingsSafe } from "@/lib/public-data";

const BASE = `/services/${GROCERY_SLUG}`;
const PAGE_SIZE = 24;

type SearchParams = { q?: string; sort?: string; page?: string };

/**
 * Products inside a single grocery category. Only this category's imagery is
 * requested, so opening a category never loads the whole catalogue.
 */
export async function GroceryCategoryProducts({
  group,
  searchParams = {},
}: {
  group: GroceryCategory;
  searchParams?: SearchParams;
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 120) : "";
  const sort = (["name", "price-asc", "price-desc"] as const).includes(
    searchParams.sort as "name" | "price-asc" | "price-desc"
  )
    ? (searchParams.sort as "name" | "price-asc" | "price-desc")
    : "featured";
  const rawPage = Number(searchParams.page);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const path = `${BASE}/${group.slug}`;

  const result = await listProducts({
    categorySlug: GROCERY_SLUG,
    groceryGroup: group.tag,
    q,
    sort,
    minPrice: sort.startsWith("price") ? 1 : undefined,
    page,
    limit: PAGE_SIZE,
  });
  const settings = await getSettingsSafe();
  const pages = Math.ceil(result.total / PAGE_SIZE);

  const pageLink = (next: number) => {
    const params = new URLSearchParams({ page: String(next), sort });
    if (q) params.set("q", q);
    return `${path}?${params}`;
  };

  return (
    <div className="bg-gradient-to-b from-pale/60 via-white to-white">
      <div className="container-page py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link href="/">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/services">Services</Link>
          <span aria-hidden>/</span>
          <Link href={BASE}>Grocery &amp; Daily Needs</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{group.name}</span>
        </nav>

        <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={BASE}
              className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-deep hover:underline"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Back to All Categories
            </Link>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
              {group.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {group.blurb}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-deep">
            {result.total} {result.total === 1 ? "product" : "products"}
            {q ? ` matching “${q}”` : ""}
          </p>
        </header>

        <form
          action={path}
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 shadow-soft sm:flex-row"
        >
          <div className="relative flex-1">
            <Search aria-hidden className="absolute left-3 top-3.5 h-5 w-5 text-muted" />
            <label htmlFor="grocery-search" className="sr-only">
              Search {group.name}
            </label>
            <input
              id="grocery-search"
              name="q"
              defaultValue={q}
              key={q}
              maxLength={120}
              placeholder={`Search in ${group.name}…`}
              className="h-12 w-full rounded-xl bg-surface pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <label htmlFor="grocery-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="grocery-sort"
            name="sort"
            defaultValue={sort}
            key={sort}
            className="h-12 rounded-xl border border-line bg-white px-3 text-sm"
          >
            <option value="featured">Recommended</option>
            <option value="name">Name: A–Z</option>
            <option value="price-asc">Price: Low to high</option>
            <option value="price-desc">Price: High to low</option>
          </select>
          <button className="h-12 rounded-xl bg-forest px-6 text-sm font-bold text-white transition hover:bg-deep">
            Apply
          </button>
        </form>

        <section className="py-7" aria-label={`${group.name} products`}>
          {result.items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {result.items.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  whatsappNumber={settings?.whatsappNumber}
                  grocery
                  priority={index < 4}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-line bg-surface px-5 py-14 text-center">
              <ShoppingBasket aria-hidden className="mx-auto mb-4 h-10 w-10 text-deep" />
              <h2 className="text-xl font-bold text-forest">
                {q ? "No matching products" : "No products to display right now"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {q
                  ? "Try a different product or brand name."
                  : "Products in this category may be awaiting availability. Please check back soon."}
              </p>
              <Link href={path} className="mt-5 inline-block font-bold text-deep underline">
                Clear search and filters
              </Link>
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Product pages" className="mt-8 flex items-center justify-center gap-3 text-sm">
              {page > 1 ? (
                <Link
                  href={pageLink(page - 1)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full border border-line px-4 transition hover:border-brand"
                >
                  <ChevronLeft aria-hidden className="h-4 w-4" />
                  Previous
                </Link>
              ) : (
                <span className="inline-flex min-h-11 items-center gap-1 rounded-full border border-line px-4 opacity-40">
                  <ChevronLeft aria-hidden className="h-4 w-4" />
                  Previous
                </span>
              )}
              <span className="px-2 font-semibold text-forest">
                Page {page} of {pages}
              </span>
              {page < pages ? (
                <Link
                  href={pageLink(page + 1)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full bg-forest px-4 font-bold text-white transition hover:bg-deep"
                >
                  Next
                  <ChevronRight aria-hidden className="h-4 w-4" />
                </Link>
              ) : (
                <span className="inline-flex min-h-11 items-center gap-1 rounded-full bg-forest px-4 font-bold text-white opacity-40">
                  Next
                  <ChevronRight aria-hidden className="h-4 w-4" />
                </span>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
