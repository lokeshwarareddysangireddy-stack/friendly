import { createPromotion, listPromotions } from "@/lib/db";
import { promotionInputSchema } from "@/lib/validation/schemas";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { revalidatePublicContent } from "@/lib/admin/revalidate";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const items = await listPromotions({});
    return jsonOk({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const parsed = promotionInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Please correct the highlighted fields", 422, {
        fields: zodFields(parsed.error),
      });
    }
    const promo = await createPromotion(parsed.data);
    revalidatePublicContent();
    return jsonOk(promo, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
