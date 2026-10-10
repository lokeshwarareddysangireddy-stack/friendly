import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import type { CategoryDoc } from "@/types";

export function CategoryCard({ category }: { category: CategoryDoc }) {
  const hasPhoto =
    category.image?.url && !category.image.url.endsWith(".svg");

  return (
    <Link
      href={`/services/${category.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-line bg-white card-lift"
    >
      <div className="relative overflow-hidden">
        <ProductImage
          src={hasPhoto ? category.image?.url : undefined}
          alt={category.image?.alt || category.name}
          seed={category.slug}
          rounded="rounded-none"
          className="aspect-[4/3] w-full"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/15 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
          <h3 className="font-display text-lg font-extrabold leading-tight text-white drop-shadow-sm">
            {category.name}
          </h3>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-forest translate-y-1 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="flex-1 text-sm leading-relaxed text-muted">
          {category.description}
        </p>
        {category.highlights && category.highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {category.highlights.slice(0, 3).map((h) => (
              <span
                key={h}
                className="rounded-full bg-pale px-2.5 py-1 text-[11px] font-semibold text-deep"
              >
                {h}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
