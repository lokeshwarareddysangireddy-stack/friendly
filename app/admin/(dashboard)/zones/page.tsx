import { AdminHeading } from "@/components/admin/ui";
import { ZonesManager } from "@/components/admin/ZonesManager";
import { listZones } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminZonesPage() {
  const zones = await listZones({ includeInactive: true });
  return (
    <>
      <AdminHeading
        title="Delivery Zones"
        description="Pincode-based delivery charges, minimums and free-delivery thresholds."
      />
      <ZonesManager initialItems={zones} />
    </>
  );
}
