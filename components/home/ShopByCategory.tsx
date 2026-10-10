import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductImage } from "@/components/ui/ProductImage";
import type { CategoryDoc } from "@/types";

export function ShopByCategory({
  categories,
  whatsappNumber,
}: {
  categories: CategoryDoc[];
  whatsappNumber: string;
}) {
  void whatsappNumber;
  if (!categories.length) return null;
  return (
    <section className="container-page py-16 lg:py-20">
      <SectionHeading
        eyebrow="Quick links"
        title="Shop by category"
        description="Jump straight to the service you need."
        action={{ label: "All services", href: "/services" }}
        align="left"
      />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/services/${c.slug}`}
            className="group flex flex-col items-center gap-3 rounded-3xl border border-line bg-white p-4 text-center transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-soft"
          >
            <ProductImage
              src={c.image?.url && !c.image.url.endsWith(".svg") ? c.image.url : undefined}
              alt={c.name}
              seed={c.slug}
              rounded="rounded-2xl"
              className="h-20 w-20"
              sizes="80px"
            />
            <span className="text-xs font-bold leading-tight text-forest">
              {c.name}
            </span>
            <ArrowRight className="h-4 w-4 text-deep opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  );
}
