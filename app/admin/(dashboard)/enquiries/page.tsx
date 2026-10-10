import { AdminHeading } from "@/components/admin/ui";
import { EnquiriesManager } from "@/components/admin/EnquiriesManager";
import { listEnquiries } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  const enquiries = await listEnquiries({});
  return (
    <>
      <AdminHeading
        title="Enquiries"
        description="Customer enquiries submitted through the website."
      />
      <EnquiriesManager initialItems={enquiries} />
    </>
  );
}
