import { requireCustomer } from "@/lib/auth/customer-session";
import {
  createReview,
  findCustomerById,
  findReviewByCustomerProduct,
  getProductBySlug,
  listOrders,
} from "@/lib/db";
import { reviewInputSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { session, response } = await requireCustomer();
    if (!session) return response;
    if (!rateLimit(`review:${session.sub}`, 5, 60_000).allowed) {
      return jsonError("You are posting too quickly. Please try again shortly.", 429);
    }
    if (!session.emailVerified) {
      return jsonError("Please verify your email before posting a review.", 403);
    }
    const body = await request.json();
    const parsed = reviewInputSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(first?.message || "Please check your review", 422);
    }
    const product = await getProductBySlug(parsed.data.productSlug);
    if (!product) return jsonError("Product not found", 404);

    const customer = await findCustomerById(session.sub);
    if (!customer) return jsonError("Account not found", 404);

    const existing = await findReviewByCustomerProduct(customer._id, product._id);
    if (existing) return jsonError("You have already reviewed this product.", 409);

    const { items: orders } = await listOrders({ customerId: customer._id, limit: 100 });
    const purchased = orders.find(
      (o) =>
        o.paymentStatus === "paid" &&
        o.items.some((item) => item.productId === product._id)
    );

    const review = await createReview({
      productId: product._id,
      productSlug: product.slug,
      productName: product.name,
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      rating: parsed.data.rating,
      title: parsed.data.title,
      comment: parsed.data.comment,
      orderId: purchased?.orderId ?? (parsed.data.orderId || null),
      verifiedPurchase: Boolean(purchased),
      status: purchased ? "approved" : "pending",
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
      published: review.status === "approved",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
