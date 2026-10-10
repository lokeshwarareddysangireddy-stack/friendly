import {
  deleteCategory,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
} from "@/lib/db";
import { categoryInputSchema } from "@/lib/validation/schemas";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { slugify } from "@/lib/utils";
import type { CategoryDoc } from "@/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { id } = await params;
    const existing = await getCategoryById(id);
    if (!existing) return jsonError("Category not found", 404);

    const parsed = categoryInputSchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Please correct the highlighted fields", 422, {
        fields: zodFields(parsed.error),
      });
    }
    const data = parsed.data;
    const patch: Partial<CategoryDoc> = {};

    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
    if (data.active !== undefined) patch.active = data.active;
    if (data.orderingMethod !== undefined) patch.orderingMethod = data.orderingMethod;
    if (data.highlights !== undefined) patch.highlights = data.highlights;
    if (data.image !== undefined) patch.image = data.image ?? null;
    if (data.slug !== undefined || data.name !== undefined) {
      const slug = data.slug?.trim() || slugify(data.name || existing.name);
      const clash = await getCategoryBySlug(slug);
      if (clash && clash._id !== existing._id) {
        return jsonError("A category with this slug already exists", 409);
      }
      patch.slug = slug;
    }

    const category = await updateCategory(id, patch);
    return jsonOk(category);
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
    const ok = await deleteCategory(id);
    if (!ok) return jsonError("Category not found", 404);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
