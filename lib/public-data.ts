import {
  getSettings,
  listCategories,
  listFaqs,
  listProducts,
  listPromotions,
} from "@/lib/db";
import { SEED_SETTINGS } from "@/lib/db/seed-data";
import type {
  CategoryDoc,
  FAQDoc,
  ProductDoc,
  PromotionDoc,
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

export function getSettingsSafe(): Promise<SiteSettingsDoc> {
  return safe(() => getSettings(), SEED_SETTINGS);
}

export function getActiveCategories(): Promise<CategoryDoc[]> {
  return safe(() => listCategories({ active: true }), []);
}

export function getFeaturedProducts(limit = 8): Promise<ProductDoc[]> {
  return safe(
    () => listProducts({ featured: true, limit, sort: "featured" }).then((r) => r.items),
    []
  );
}

export function getActiveFaqs(): Promise<FAQDoc[]> {
  return safe(() => listFaqs({ active: true }), []);
}

export function getActivePromotions(): Promise<PromotionDoc[]> {
  return safe(() => listPromotions({ active: true }), []);
}
