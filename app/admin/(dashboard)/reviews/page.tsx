import { AdminHeading } from "@/components/admin/ui";
import { ReviewsManager } from "@/components/admin/ReviewsManager";
import { listReviews } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const { items } = await listReviews({ limit: 50 });
  return (
    <>
      <AdminHeading
        title="Reviews"
        description="Moderate customer reviews and testimonials. Approved reviews appear on the storefront."
      />
      <ReviewsManager initialItems={items} />
    </>
  );
}
