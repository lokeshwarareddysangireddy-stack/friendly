import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ServiceCategories } from "@/components/home/ServiceCategories";
import { ServicesCatalog } from "@/components/services/ServicesCatalog";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FinalCta } from "@/components/home/FinalCta";
import {
  getActiveCategories,
  getActiveProducts,
  getSettingsSafe,
} from "@/lib/public-data";
import { SITE } from "@/lib/site";
import type { ProductDoc } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All Services",
  description:
    "Explore all Friendly Basket services: cafe-style food, biryanis, curries and meals, grocery and daily needs, fruits and vegetables, health essentials and custom requests.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const [settings, categories, products] = await Promise.all([
    getSettingsSafe(),
    getActiveCategories(),
    getActiveProducts(100),
  ]);

  const productsByCategory = products.reduce<Record<string, ProductDoc[]>>(
    (acc, product) => {
      (acc[product.categorySlug] ||= []).push(product);
      return acc;
    },
    {}
  );

  const productCounts = Object.fromEntries(
    Object.entries(productsByCategory).map(([slug, items]) => [slug, items.length])
  ) as Record<string, number>;

  return (
    <>
      <div className="border-b border-line bg-gradient-to-b from-pale/60 to-white">
        <div className="container-page py-14 text-center lg:py-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-deep">
            Our services
          </span>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-extrabold tracking-tight text-forest text-balance sm:text-5xl">
            Everything You Need. One Basket.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">
            {SITE.name} brings local food, groceries and everyday essentials together.
            Browse a category to order online, or send a WhatsApp enquiry for anything
            specific.
          </p>
        </div>
      </div>

      <ServiceCategories
        categories={categories}
        productCounts={productCounts}
        whatsappNumber={settings.whatsappNumber}
      />

      {categories.length > 0 && (
        <ServicesCatalog
          categories={categories}
          productsByCategory={productsByCategory}
          whatsappNumber={settings.whatsappNumber}
        />
      )}

      <HowItWorks />

      <section className="container-page py-16">
        <div className="flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-line bg-surface p-8 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-forest">
              Cannot find what you are looking for?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Send us a custom request and we will confirm availability, pricing and
              delivery options.
            </p>
          </div>
          <Link
            href="/contact#enquiry"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            Send a request
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <FinalCta whatsappNumber={settings.whatsappNumber} />
    </>
  );
}
