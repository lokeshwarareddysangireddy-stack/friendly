import type { MetadataRoute } from "next";
import { listCategories, listProducts } from "@/lib/db";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "@/lib/db/seed-data";
import { SITE } from "@/lib/site";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE.domain}`;

const STATIC_ROUTES = [
  "",
  "/services",
  "/how-it-works",
  "/about",
  "/contact",
  "/faq",
  "/privacy-policy",
  "/terms-and-conditions",
  "/delivery-and-cancellation-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let categories = SEED_CATEGORIES.map((c) => ({ slug: c.slug }));
  let products = SEED_PRODUCTS.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));

  try {
    const [cats, prods] = await Promise.all([
      listCategories({ active: true }),
      listProducts({ active: true, limit: 100, sort: "featured" }),
    ]);
    if (cats.length) categories = cats.map((c) => ({ slug: c.slug }));
    if (prods.items.length)
      products = prods.items.map((p) => ({
        slug: p.slug,
        updatedAt: p.updatedAt,
      }));
  } catch {
    // fall back to seed data
  }

  const now = new Date();

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
      priority: route === "" ? 1 : 0.7,
    })),
    ...categories.map((c) => ({
      url: `${baseUrl}/services/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
