"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { WA_TEMPLATES } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { CategoryDoc, ProductDoc } from "@/types";

const PREVIEW = 4;

export interface ServicesCatalogProps {
  categories: CategoryDoc[];
  productsByCategory: Record<string, ProductDoc[]>;
  whatsappNumber: string;
}

export function ServicesCatalog({
  categories,
  productsByCategory,
  whatsappNumber,
}: ServicesCatalogProps) {
  const [active, setActive] = useState<string>("all");

  const totalItems = categories.reduce(
    (sum, c) => sum + (productsByCategory[c.slug]?.length ?? 0),
    0
  );

  const visible =
    active === "all" ? categories : categories.filter((c) => c.slug === active);

  return (
    <section id="browse" className="container-page py-4">
      <div className="rounded-[2rem] border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
              Browse what is available
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              {totalItems > 0
                ? `${totalItems} ${totalItems === 1 ? "item" : "items"} ready to order across ${categories.length} categories.`
                : "Pick a category to see what we are stocking right now."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="All items"
              count={totalItems}
              active={active === "all"}
              onClick={() => setActive("all")}
            />
            {categories.map((c) => (
              <FilterChip
                key={c._id}
                label={c.name}
                count={productsByCategory[c.slug]?.length ?? 0}
                active={active === c.slug}
                onClick={() => setActive(c.slug)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-16">
        {visible.map((category) => (
          <CategorySection
            key={category._id}
            category={category}
            products={productsByCategory[category.slug] ?? []}
            whatsappNumber={whatsappNumber}
          />
        ))}
      </div>
    </section>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-2 text-xs font-bold transition sm:text-sm",
        active
          ? "border-brand bg-brand text-white shadow-soft"
          : "border-line bg-white text-forest hover:border-brand hover:bg-pale"
      )}
    >
      {label}
      <span className={cn("ml-1.5", active ? "text-white/75" : "text-muted")}>
        {count}
      </span>
    </button>
  );
}

function CategorySection({
  category,
  products,
  whatsappNumber,
}: {
  category: CategoryDoc;
  products: ProductDoc[];
  whatsappNumber: string;
}) {
  const preview = products.slice(0, PREVIEW);

  return (
    <div id={`category-${category.slug}`} className="scroll-mt-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-display text-2xl font-extrabold tracking-tight text-forest">
            {category.name}
          </h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            {category.description}
          </p>
        </div>
        <Link
          href={`/services/${category.slug}`}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-deep transition hover:text-forest"
        >
          View all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {preview.length > 0 ? (
        <>
          <ProductGrid
            products={preview}
            whatsappNumber={whatsappNumber}
            className="mt-6"
          />
          {products.length > PREVIEW && (
            <div className="mt-6 flex justify-center">
              <Link
                href={`/services/${category.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-forest transition hover:border-brand hover:bg-pale"
              >
                View all {products.length} items in {category.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          className="mt-6"
          icon={<PackageSearch className="h-6 w-6" />}
          title="Nothing stocked here just yet"
          description="This category is handled on request. Tell us what you need and we will confirm availability and pricing."
          action={
            <WhatsAppLink
              message={
                category.orderingMethod === "enquiry"
                  ? WA_TEMPLATES.medicine
                  : WA_TEMPLATES.general
              }
              number={whatsappNumber}
            >
              Send an enquiry
            </WhatsAppLink>
          }
        />
      )}
    </div>
  );
}
