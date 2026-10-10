import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductBrowser } from "@/components/products/ProductBrowser";
import { listProducts } from "@/lib/db";
import { getActiveCategories, getSettingsSafe } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Products",
  description:
    "Search and filter the Friendly Basket catalog across food, groceries and everyday essentials.",
  alternates: { canonical: "/search" },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const [settings, categories, result] = await Promise.all([
    getSettingsSafe(),
    getActiveCategories(),
    listProducts({
      q: q || undefined,
      categorySlug: category || undefined,
      limit: 12,
      sort: "featured",
    }),
  ]);

  return (
    <>
      <div className="border-b border-line bg-gradient-to-b from-pale/60 to-white">
        <div className="container-page py-10 lg:py-12">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-xs font-semibold text-muted"
          >
            <Link href="/" className="hover:text-deep">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-forest">Search</span>
          </nav>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
            {q ? `Results for "${q}"` : "Browse all products"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Filter by category, sort by price and find exactly what you need.
          </p>
        </div>
      </div>

      <section className="container-page py-10">
        <ProductBrowser
          initialItems={result.items}
          initialTotal={result.total}
          initialQuery={q || ""}
          initialCategory={category || ""}
          categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
          whatsappNumber={settings.whatsappNumber}
        />
      </section>
    </>
  );
}
