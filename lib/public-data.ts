import { cache } from "react";
import {
  getCategoryBySlug,
  getSettings,
  listCategories,
  listFaqs,
  listProducts,
  listPromotions,
  listReviews,
} from "@/lib/db";
import {
  SEED_CATEGORIES,
  SEED_FAQS,
  SEED_PRODUCTS,
  SEED_PROMOTIONS,
  SEED_SETTINGS,
} from "@/lib/db/seed-data";
import type {
  CategoryDoc,
  FAQDoc,
  ProductDoc,
  PromotionDoc,
  ReviewDoc,
  SiteSettingsDoc,
} from "@/types";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[public-data]", (error as Error).message);
    return fallback;
  }
}

const seedCategories = SEED_CATEGORIES.filter((c) => c.active);
const seedFaqs = SEED_FAQS.filter((f) => f.active);
const seedPromotions = SEED_PROMOTIONS.filter((p) => p.active);

function sortCategories(items: CategoryDoc[]): CategoryDoc[] {
  return [...items].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
  );
}

/**
 * The canonical service categories must always be visible even if a category row
 * has not been created in the database yet. Existing database categories always
 * take precedence; only seed categories whose slug is missing are appended, so no
 * duplicates are ever produced.
 */
function mergeWithSeedCategories(dbCategories: CategoryDoc[]): CategoryDoc[] {
  const seen = new Set(dbCategories.map((c) => c.slug));
  const merged = [...dbCategories];
  for (const seed of seedCategories) {
    if (!seen.has(seed.slug)) merged.push(seed);
  }
  return sortCategories(merged);
}

export const getSettingsSafe = cache((): Promise<SiteSettingsDoc> => {
  return safe(() => getSettings(), SEED_SETTINGS);
});

export const getActiveCategories = cache((): Promise<CategoryDoc[]> => {
  return safe(
    async () => mergeWithSeedCategories(await listCategories({ active: true })),
    seedCategories
  );
});

export const getPublicCategoryBySlug = cache(
  (slug: string): Promise<CategoryDoc | null> => {
    const fallback = seedCategories.find((c) => c.slug === slug) ?? null;
    return safe(async () => (await getCategoryBySlug(slug)) ?? fallback, fallback);
  }
);

export const getActiveProducts = cache((limit = 100): Promise<ProductDoc[]> => {
  return safe(
    () => listProducts({ active: true, limit, sort: "featured" }).then((r) => r.items),
    SEED_PRODUCTS.filter((p) => p.active).slice(0, limit)
  );
});

export const getFeaturedProducts = cache((limit = 8): Promise<ProductDoc[]> => {
  return safe(
    () => listProducts({ featured: true, limit, sort: "featured" }).then((r) => r.items),
    SEED_PRODUCTS.filter((p) => p.featured && p.active).slice(0, limit)
  );
});

export const getActiveFaqs = cache(
  (limit?: number): Promise<FAQDoc[]> => {
    return safe(
      () => listFaqs({ active: true, limit }),
      limit ? seedFaqs.slice(0, limit) : seedFaqs
    );
  }
);

export const getActivePromotions = cache((): Promise<PromotionDoc[]> => {
  return safe(() => listPromotions({ active: true }), seedPromotions);
});

export const getApprovedReviews = cache(
  (limit = 6): Promise<{ reviews: ReviewDoc[]; total: number }> => {
    return safe(
      async () => {
        const result = await listReviews({ approved: true, limit });
        return { reviews: result.items, total: result.total };
      },
      { reviews: [], total: 0 }
    );
  }
);
