import { listCategories } from "@/lib/db";
import { handleRouteError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await listCategories({ active: true });
    return jsonOk({ items: categories });
  } catch (error) {
    return handleRouteError(error);
  }
}
