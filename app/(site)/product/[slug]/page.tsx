import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductDetail } from "@/components/products/ProductDetail";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  getCategoryById,
  getCategoryBySlug,
  getProductBySlug,
  relatedProducts,
} from "@/lib/db";
import { getSettingsSafe } from "@/lib/public-data";
import { truncate } from "@/lib/utils";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: truncate(product.description || `${product.name} available at ${SITE.name}.`, 155),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description: truncate(product.description, 155),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();

  const [settings, related, category] = await Promise.all([
    getSettingsSafe(),
    relatedProducts(product, 4),
    product.categoryId
      ? getCategoryById(product.categoryId)
      : getCategoryBySlug(product.categorySlug),
  ]);

  const inStock =
    !product.trackStock || product.stockQty == null || product.stockQty > 0;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku || product.slug,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="border-b border-line bg-surface/60">
        <div className="container-page py-5">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-xs font-semibold text-muted"
          >
            <Link href="/" className="hover:text-deep">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/services" className="hover:text-deep">
              Services
            </Link>
            {category && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href={`/services/${category.slug}`} className="hover:text-deep">
                  {category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-forest">{product.name}</span>
          </nav>
        </div>
      </div>

      <section className="container-page py-10 lg:py-14">
        <ProductDetail product={product} whatsappNumber={settings.whatsappNumber} />
      </section>

      {related.length > 0 && (
        <section className="bg-surface py-14">
          <div className="container-page">
            <SectionHeading
              title="You might also like"
              description={`More from ${category?.name ?? "this category"}.`}
              align="left"
            />
            <div className="mt-8">
              <ProductGrid
                products={related}
                whatsappNumber={settings.whatsappNumber}
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
