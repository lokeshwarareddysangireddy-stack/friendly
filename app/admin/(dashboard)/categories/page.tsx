import { AdminHeading } from "@/components/admin/ui";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { listCategories } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await listCategories({ includeInactive: true });
  return (
    <>
      <AdminHeading
        title="Categories"
        description="Service categories used across the storefront."
      />
      <CategoriesManager initialItems={categories} />
    </>
  );
}
