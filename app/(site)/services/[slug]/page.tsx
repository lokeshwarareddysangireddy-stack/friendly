import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Info } from "lucide-react";
import { CategoryProductBrowser } from "@/components/services/CategoryProductBrowser";
import { ProductImage } from "@/components/ui/ProductImage";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { listProducts, getCategoryBySlug } from "@/lib/db";
import { getActiveCategories, getSettingsSafe } from "@/lib/public-data";
import { WA_TEMPLATES } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Service not found" };
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/services/${category.slug}` },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category || !category.active) notFound();

  const [settings, categories, productResult] = await Promise.all([
    getSettingsSafe(),
    getActiveCategories(),
    listProducts({ categorySlug: slug, limit: 12, sort: "featured" }),
  ]);

  const others = categories.filter((c) => c.slug !== slug).slice(0, 5);
  const isEnquiryLed = category.orderingMethod === "enquiry";

  const waTemplate = isEnquiryLed
    ? WA_TEMPLATES.medicine
    : WA_TEMPLATES.general;

  return (
    <>
      <div className="border-b border-line bg-gradient-to-b from-pale/60 to-white">
        <div className="container-page py-10 lg:py-14">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-xs font-semibold text-muted"
          >
            <Link href="/" className="hover:text-deep">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/services" className="hover:text-deep">
              Services
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-forest">{category.name}</span>
          </nav>

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-forest text-balance sm:text-5xl">
                {category.name}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                {category.description}
              </p>
              {category.highlights && category.highlights.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {category.highlights.map((h) => (
                    <span
                      key={h}
                      className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-deep"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}
              {isEnquiryLed && (
                <p className="mt-5 flex max-w-xl items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  This category is handled through WhatsApp enquiries. Where a valid
                  prescription is legally required, it must be provided. We do not claim
                  licensed-pharmacy status unless separately confirmed.
                </p>
              )}
            </div>
            <div className="hidden lg:block">
              <ProductImage
                src={
                  category.image?.url && !category.image.url.endsWith(".svg")
                    ? category.image.url
                    : undefined
                }
                alt={category.name}
                seed={category.slug}
                className="aspect-[4/3] w-full"
                sizes="40vw"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="container-page py-12 lg:py-16">
        <CategoryProductBrowser
          categorySlug={slug}
          categoryName={category.name}
          orderingMethod={category.orderingMethod}
          initialItems={productResult.items}
          initialTotal={productResult.total}
          whatsappNumber={settings.whatsappNumber}
        />
      </section>

      <section className="bg-surface py-14">
        <div className="container-page">
          <div className="flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-line bg-white p-8 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="font-display text-xl font-extrabold text-forest">
                Need something specific from {category.name}?
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                Message us and we will confirm availability and pricing.
              </p>
            </div>
            <WhatsAppLink
              message={waTemplate}
              number={settings.whatsappNumber}
              className="h-12 shrink-0 px-6 text-sm"
            >
              Enquire on WhatsApp
            </WhatsAppLink>
          </div>

          {others.length > 0 && (
            <div className="mt-10">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted">
                Explore other services
              </h3>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {others.map((c) => (
                  <Link
                    key={c._id}
                    href={`/services/${c.slug}`}
                    className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-brand hover:bg-pale"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
