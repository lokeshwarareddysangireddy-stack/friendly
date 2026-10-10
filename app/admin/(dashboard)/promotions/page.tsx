import { AdminHeading } from "@/components/admin/ui";
import { PromotionsManager } from "@/components/admin/PromotionsManager";
import { listPromotions } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const promotions = await listPromotions({});
  return (
    <>
      <AdminHeading
        title="Promotions"
        description="Announcements and banners displayed on the site."
      />
      <PromotionsManager initialItems={promotions} />
    </>
  );
}
