import { NextRequest } from "next/server";
import { getProductBySlug, listReviews, getRatingSummary } from "@/lib/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return jsonError("Product not found", 404);
    const [{ items }, summary] = await Promise.all([
      listReviews({ productSlug: slug, approved: true, limit: 50 }),
      getRatingSummary(slug),
    ]);
    const reviews = items.map((r) => ({
      _id: r._id,
      customerName: r.customerName,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      verifiedPurchase: r.verifiedPurchase,
      createdAt: r.createdAt,
    }));
    return jsonOk({ reviews, summary });
  } catch (error) {
    return handleRouteError(error);
  }
}
