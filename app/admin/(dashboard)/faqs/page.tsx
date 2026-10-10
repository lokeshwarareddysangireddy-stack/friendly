import { AdminHeading } from "@/components/admin/ui";
import { FaqsManager } from "@/components/admin/FaqsManager";
import { listFaqs } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const faqs = await listFaqs({});
  return (
    <>
      <AdminHeading title="FAQs" description="Manage frequently asked questions." />
      <FaqsManager initialItems={faqs} />
    </>
  );
}
