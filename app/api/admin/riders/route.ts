import { requireApiSession } from "@/lib/auth/guard";
import { listRiders } from "@/lib/db";
import { handleRouteError, jsonOk } from "@/lib/http";
import type { RiderStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status = statusParam as RiderStatus | null;
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 50);
    const result = await listRiders({ status, page, limit });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
