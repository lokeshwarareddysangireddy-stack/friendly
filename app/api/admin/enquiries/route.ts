import { listEnquiries } from "@/lib/db";
import { requireApiSession } from "@/lib/auth/guard";
import { handleRouteError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const status = new URL(request.url).searchParams.get("status") || undefined;
    const items = await listEnquiries({ status });
    return jsonOk({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
