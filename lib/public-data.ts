import { cache } from "react";
import {
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

export const getSettingsSafe = cache((): Promise<SiteSettingsDoc> => {
  return safe(() => getSettings(), SEED_SETTINGS);
});

export const getActiveCategories = cache((): Promise<CategoryDoc[]> => {
  return safe(() => listCategories({ active: true }), seedCategories);
});

export const getFeaturedProducts = cache((limit = 8): Promise<ProductDoc[]> => {
  return safe(
    () => listProducts({ featured: true, limit, sort: "featured" }).then((r) => r.items),
    SEED_PRODUCTS.filter((p) => p.featured && p.active).slice(0, limit)
  );
});

export const getActiveFaqs = cache((): Promise<FAQDoc[]> => {
  return safe(() => listFaqs({ active: true }), seedFaqs);
});

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
