import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guard";
import { deleteReview, updateReview } from "@/lib/db";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { revalidatePublicContent } from "@/lib/admin/revalidate";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  title: z.string().trim().max(80).optional(),
  comment: z.string().trim().min(1).max(1000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Invalid review update", 422, { fields: zodFields(parsed.error) });
    }
    const review = await updateReview(id, parsed.data);
    if (!review) return jsonError("Review not found", 404);
    revalidatePublicContent();
    return jsonOk(review);
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
    const ok = await deleteReview(id);
    if (!ok) return jsonError("Review not found", 404);
    revalidatePublicContent();
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
