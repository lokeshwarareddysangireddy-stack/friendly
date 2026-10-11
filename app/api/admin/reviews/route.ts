import { requireApiSession } from "@/lib/auth/guard";
import { listReviews } from "@/lib/db";
import { handleRouteError, jsonOk } from "@/lib/http";
import type { ReviewStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUSES: ReviewStatus[] = ["pending", "approved", "rejected"];

export async function GET(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam && STATUSES.includes(statusParam as ReviewStatus)
        ? (statusParam as ReviewStatus)
        : undefined;
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 50);
    const result = await listReviews({ status, page, limit });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
