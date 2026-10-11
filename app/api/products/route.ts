import { NextRequest } from "next/server";
import { listProducts } from "@/lib/db";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortParam = searchParams.get("sort");
    const sort = (
      ["featured", "price-asc", "price-desc", "newest", "name"].includes(sortParam || "")
        ? sortParam
        : "featured"
    ) as "featured" | "price-asc" | "price-desc" | "newest" | "name";

    const idsParam = searchParams.get("ids");
    const ids = idsParam
      ? idsParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 100)
      : undefined;

    const result = await listProducts({
      q: searchParams.get("q") || undefined,
      categorySlug: searchParams.get("category") || undefined,
      ids,
      featured: searchParams.get("featured") === "true" ? true : undefined,
      orderingOnline: searchParams.get("online") === "true" ? true : undefined,
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 24),
      sort,
    });

    if (
      !result.items.length &&
      !searchParams.get("q") &&
      !searchParams.get("category") &&
      !ids
    ) {
      return jsonError("No products available", 404);
    }

    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
