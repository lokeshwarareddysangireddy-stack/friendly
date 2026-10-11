import { createReview, getProductBySlug } from "@/lib/db";
import { reviewInputSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`review:${ip}`, 5, 60_000).allowed) {
      return jsonError("You are posting too quickly. Please try again shortly.", 429);
    }
    const body = await request.json();
    const parsed = reviewInputSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(first?.message || "Please check your review", 422);
    }
    const product = await getProductBySlug(parsed.data.productSlug);
    if (!product) return jsonError("Product not found", 404);

    const review = await createReview({
      productId: product._id,
      productSlug: product.slug,
      productName: product.name,
      customerName: parsed.data.name,
      rating: parsed.data.rating,
      title: parsed.data.title,
      comment: parsed.data.comment,
      verifiedPurchase: false,
      status: "pending",
    });

    return jsonOk({
      review: {
        _id: review._id,
        customerName: review.customerName,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verifiedPurchase: review.verifiedPurchase,
        createdAt: review.createdAt,
      },
      published: false,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
