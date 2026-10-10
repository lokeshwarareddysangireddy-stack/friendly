import { revalidatePath } from "next/cache";

/**
 * Public pages such as the homepage and navbar are prerendered at build time.
 * Call this after any admin change so the site picks up new services,
 * products, settings and promotions immediately.
 */
export function revalidatePublicContent() {
  try {
    revalidatePath("/", "layout");
  } catch (error) {
    console.warn("[revalidate]", (error as Error).message);
  }
}
