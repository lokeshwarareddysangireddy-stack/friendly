import { deleteZone, getZoneById, updateZone } from "@/lib/db";
import { zoneInputSchema } from "@/lib/validation/schemas";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { revalidatePublicContent } from "@/lib/admin/revalidate";
import { rupeesToPaise } from "@/lib/utils";
import type { DeliveryZoneDoc } from "@/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { id } = await params;
    if (!(await getZoneById(id))) return jsonError("Zone not found", 404);

    const parsed = zoneInputSchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Please correct the highlighted fields", 422, {
        fields: zodFields(parsed.error),
      });
    }
    const data = parsed.data;
    const patch: Partial<DeliveryZoneDoc> = {};

    if (data.name !== undefined) patch.name = data.name;
    if (data.zoneCode !== undefined) patch.zoneCode = data.zoneCode.toUpperCase();
    if (data.pincodes !== undefined) patch.pincodes = data.pincodes;
    if (data.city !== undefined) patch.city = data.city;
    if (data.locality !== undefined) patch.locality = data.locality;
    if (data.deliveryCharge !== undefined)
      patch.deliveryCharge = rupeesToPaise(data.deliveryCharge);
    if (data.minOrderValue !== undefined)
      patch.minOrderValue =
        data.minOrderValue != null ? rupeesToPaise(data.minOrderValue) : null;
    if (data.freeDeliveryThreshold !== undefined)
      patch.freeDeliveryThreshold =
        data.freeDeliveryThreshold != null
          ? rupeesToPaise(data.freeDeliveryThreshold)
          : null;
    if (data.etaText !== undefined) patch.etaText = data.etaText;
    if (data.active !== undefined) patch.active = data.active;
    if (data.notes !== undefined) patch.notes = data.notes;

    const zone = await updateZone(id, patch);
    revalidatePublicContent();
    return jsonOk(zone);
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
    const ok = await deleteZone(id);
    if (!ok) return jsonError("Zone not found", 404);
    revalidatePublicContent();
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
