import { notFound } from "next/navigation";
import { GroceryCatalog } from "@/components/services/GroceryCatalog";
import { GROCERY_CATEGORIES, GROCERY_SLUG, OTHER_GROCERY } from "@/lib/grocery-categories";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ slug: string; groceryCategory: string }>;
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
};
export async function generateMetadata({ params }: Props) {
  const { slug, groceryCategory } = await params;
  const group = [...GROCERY_CATEGORIES, OTHER_GROCERY].find((entry) => entry.slug === groceryCategory);
  return { title: group?.name || "Category not found", alternates: { canonical: `/services/${slug}/${groceryCategory}` } };
}
export default async function GroceryCategoryPage({ params, searchParams }: Props) {
  const { slug, groceryCategory } = await params;
  const group = [...GROCERY_CATEGORIES, OTHER_GROCERY].find((entry) => entry.slug === groceryCategory);
  if (slug !== GROCERY_SLUG || !group) notFound();
  return <GroceryCatalog group={group} searchParams={await searchParams} />;
}
