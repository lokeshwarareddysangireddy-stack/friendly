import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/products/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShoppingBasket } from "lucide-react";
import Link from "next/link";
import type { ProductDoc } from "@/types";

export function FeaturedProducts({
  products,
  whatsappNumber,
}: {
  products: ProductDoc[];
  whatsappNumber: string;
}) {
  return (
    <section className="container-page py-16 lg:py-20">
      <SectionHeading
        eyebrow="Handpicked"
        title="Featured products"
        description="A selection of popular food, grocery and everyday items available to order online."
        action={{ label: "Browse all", href: "/search" }}
        align="left"
      />
      <div className="mt-10">
        {products.length ? (
          <ProductGrid products={products} whatsappNumber={whatsappNumber} />
        ) : (
          <EmptyState
            icon={<ShoppingBasket className="h-6 w-6" />}
            title="Featured products are being updated"
            description="Please check back soon, or browse all our services to see what is currently available."
            action={
              <Link
                href="/services"
                className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-white"
              >
                Browse services
              </Link>
            }
          />
        )}
      </div>
    </section>
  );
}
