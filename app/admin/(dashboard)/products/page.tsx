import { AdminHeading } from "@/components/admin/ui";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { listCategories, listProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [result, categories] = await Promise.all([
    listProducts({ includeInactive: true, limit: 100, sort: "newest" }),
    listCategories({ includeInactive: true }),
  ]);

  return (
    <>
      <AdminHeading
        title="Products"
        description="Manage catalog items, pricing and availability."
      />
      <ProductsManager
        initialItems={result.items}
        initialTotal={result.total}
        categories={categories}
      />
    </>
  );
}
