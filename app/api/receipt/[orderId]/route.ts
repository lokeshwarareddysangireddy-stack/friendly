import { getOrderByOrderId } from "@/lib/db";
import { buildReceiptPdf } from "@/lib/receipt/pdf";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const token = new URL(request.url).searchParams.get("token") || "";

  const order = await getOrderByOrderId(orderId.toUpperCase());
  if (!order) return jsonError("Order not found", 404);

  if (!token || token !== order.lookupToken) {
    return jsonError("This receipt link is not valid or has expired.", 403);
  }

  if (order.paymentStatus !== "paid") {
    return jsonError("A receipt is available only after payment is verified.", 409);
  }

  try {
    const pdf = await buildReceiptPdf(order);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="FriendlyBasket-${order.orderId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[receipt]", (error as Error).message);
    return jsonError("Could not generate receipt", 500);
  }
}
