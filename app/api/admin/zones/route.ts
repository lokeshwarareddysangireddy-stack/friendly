import { createZone, listZones } from "@/lib/db";
import { zoneInputSchema } from "@/lib/validation/schemas";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rupeesToPaise } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const items = await listZones({ includeInactive: true });
    return jsonOk({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const parsed = zoneInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Please correct the highlighted fields", 422, {
        fields: zodFields(parsed.error),
      });
    }
    const data = parsed.data;
    const zone = await createZone({
      ...data,
      deliveryCharge: rupeesToPaise(data.deliveryCharge),
      minOrderValue:
        data.minOrderValue != null ? rupeesToPaise(data.minOrderValue) : null,
      freeDeliveryThreshold:
        data.freeDeliveryThreshold != null
          ? rupeesToPaise(data.freeDeliveryThreshold)
          : null,
    });
    return jsonOk(zone, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
