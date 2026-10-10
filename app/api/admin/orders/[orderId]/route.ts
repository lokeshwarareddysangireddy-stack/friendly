import { z } from "zod";
import { getOrderByOrderId, updateOrderByOrderId } from "@/lib/db";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  paymentStatus: z
    .enum(["pending", "paid", "failed", "refund_pending", "refunded"])
    .optional(),
  fulfilmentStatus: z
    .enum([
      "pending",
      "accepted",
      "preparing",
      "ready",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ])
    .optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { orderId } = await params;
    const existing = await getOrderByOrderId(orderId.toUpperCase());
    if (!existing) return jsonError("Order not found", 404);

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Invalid order update", 422, {
        fields: zodFields(parsed.error),
      });
    }

    const updated = await updateOrderByOrderId(orderId.toUpperCase(), parsed.data);
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
