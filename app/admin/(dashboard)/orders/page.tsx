import { AdminHeading } from "@/components/admin/ui";
import { OrdersManager } from "@/components/admin/OrdersManager";
import { listOrders } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const result = await listOrders({ limit: 100 });

  return (
    <>
      <AdminHeading
        title="Orders"
        description="Track payments and update fulfilment status."
      />
      <OrdersManager initialItems={result.items} initialTotal={result.total} />
    </>
  );
}
