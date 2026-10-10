import { deletePromotion, updatePromotion } from "@/lib/db";
import { promotionInputSchema } from "@/lib/validation/schemas";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { id } = await params;
    const parsed = promotionInputSchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Please correct the highlighted fields", 422, {
        fields: zodFields(parsed.error),
      });
    }
    const promo = await updatePromotion(id, parsed.data);
    if (!promo) return jsonError("Promotion not found", 404);
    return jsonOk(promo);
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
    const ok = await deletePromotion(id);
    if (!ok) return jsonError("Promotion not found", 404);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
