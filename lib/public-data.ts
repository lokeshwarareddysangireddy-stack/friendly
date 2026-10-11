import { cache } from "react";
import {
  getSettings,
  listCategories,
  listFaqs,
  listProducts,
  listPromotions,
  listReviews,
} from "@/lib/db";
import { SEED_SETTINGS } from "@/lib/db/seed-data";
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

export const getSettingsSafe = cache((): Promise<SiteSettingsDoc> => {
  return safe(() => getSettings(), SEED_SETTINGS);
});

export const getActiveCategories = cache((): Promise<CategoryDoc[]> => {
  return safe(() => listCategories({ active: true }), []);
});

export const getFeaturedProducts = cache((limit = 8): Promise<ProductDoc[]> => {
  return safe(
    () => listProducts({ featured: true, limit, sort: "featured" }).then((r) => r.items),
    []
  );
});

export const getActiveFaqs = cache((): Promise<FAQDoc[]> => {
  return safe(() => listFaqs({ active: true }), []);
});

export const getActivePromotions = cache((): Promise<PromotionDoc[]> => {
  return safe(() => listPromotions({ active: true }), []);
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
