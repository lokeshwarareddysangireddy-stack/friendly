import {
  createProduct,
  getCategoryById,
  getProductBySlug,
  listProducts,
} from "@/lib/db";
import { productInputSchema } from "@/lib/validation/schemas";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { revalidatePublicContent } from "@/lib/admin/revalidate";
import { rupeesToPaise, slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { searchParams } = new URL(request.url);
    const result = await listProducts({
      q: searchParams.get("q") || undefined,
      categorySlug: searchParams.get("category") || undefined,
      includeInactive: true,
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 100),
      sort: "newest",
    });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const body = await request.json();
    const parsed = productInputSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Please correct the highlighted fields", 422, {
        fields: zodFields(parsed.error),
      });
    }
    const data = parsed.data;
    const category = await getCategoryById(data.categoryId);
    if (!category) return jsonError("Select a valid category", 422);

    const slug = data.slug?.trim() || slugify(data.name);
    if (await getProductBySlug(slug)) {
      return jsonError("A product with this slug already exists", 409);
    }

    const product = await createProduct({
      name: data.name,
      slug,
      description: data.description,
      categoryId: category._id,
      categorySlug: category.slug,
      images: data.images,
      price: rupeesToPaise(data.price),
      mrp: data.mrp != null ? rupeesToPaise(data.mrp) : null,
      available: data.available,
      stockQty: data.stockQty ?? null,
      trackStock: data.trackStock,
      featured: data.featured,
      sku: data.sku,
      active: data.active,
      orderingMethod: data.orderingMethod,
      requiresPrescription: data.requiresPrescription,
      unit: data.unit,
      tags: [],
    });
    revalidatePublicContent();
    return jsonOk(product, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
