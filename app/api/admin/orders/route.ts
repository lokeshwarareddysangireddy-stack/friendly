import { listOrders } from "@/lib/db";
import { requireApiSession } from "@/lib/auth/guard";
import { handleRouteError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { searchParams } = new URL(request.url);
    const result = await listOrders({
      q: searchParams.get("q") || undefined,
      paymentStatus: searchParams.get("paymentStatus") || undefined,
      fulfilmentStatus: searchParams.get("fulfilmentStatus") || undefined,
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 50),
    });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
