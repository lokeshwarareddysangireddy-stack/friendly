import {
  deleteProduct,
  getCategoryById,
  getProductById,
  getProductBySlug,
  updateProduct,
} from "@/lib/db";
import { productInputSchema } from "@/lib/validation/schemas";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { revalidatePublicContent } from "@/lib/admin/revalidate";
import { rupeesToPaise, slugify } from "@/lib/utils";
import type { ProductDoc } from "@/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { id } = await params;
    const existing = await getProductById(id);
    if (!existing) return jsonError("Product not found", 404);

    const body = await request.json();
    const parsed = productInputSchema.partial().safeParse(body);
    if (!parsed.success) {
      return jsonError("Please correct the highlighted fields", 422, {
        fields: zodFields(parsed.error),
      });
    }
    const data = parsed.data;
    const patch: Partial<ProductDoc> = {};

    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.slug !== undefined || data.name !== undefined) {
      const slug = data.slug?.trim() || slugify(data.name || existing.name);
      const clash = await getProductBySlug(slug);
      if (clash && clash._id !== existing._id) {
        return jsonError("A product with this slug already exists", 409);
      }
      patch.slug = slug;
    }
    if (data.categoryId !== undefined) {
      const category = await getCategoryById(data.categoryId);
      if (!category) return jsonError("Select a valid category", 422);
      patch.categoryId = category._id;
      patch.categorySlug = category.slug;
    }
    if (data.price !== undefined) patch.price = rupeesToPaise(data.price);
    if (data.mrp !== undefined)
      patch.mrp = data.mrp != null ? rupeesToPaise(data.mrp) : null;
    if (data.available !== undefined) patch.available = data.available;
    if (data.stockQty !== undefined) patch.stockQty = data.stockQty ?? null;
    if (data.trackStock !== undefined) patch.trackStock = data.trackStock;
    if (data.featured !== undefined) patch.featured = data.featured;
    if (data.sku !== undefined) patch.sku = data.sku;
    if (data.active !== undefined) patch.active = data.active;
    if (data.orderingMethod !== undefined) patch.orderingMethod = data.orderingMethod;
    if (data.requiresPrescription !== undefined)
      patch.requiresPrescription = data.requiresPrescription;
    if (data.unit !== undefined) patch.unit = data.unit;
    if (data.images !== undefined) patch.images = data.images;

    const product = await updateProduct(id, patch);
    revalidatePublicContent();
    return jsonOk(product);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { id } = await params;
    const ok = await deleteProduct(id);
    if (!ok) return jsonError("Product not found", 404);
    revalidatePublicContent();
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
