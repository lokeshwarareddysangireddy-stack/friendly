import { deleteFaq, updateFaq } from "@/lib/db";
import { faqInputSchema } from "@/lib/validation/schemas";
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
    const parsed = faqInputSchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Please correct the highlighted fields", 422, {
        fields: zodFields(parsed.error),
      });
    }
    const faq = await updateFaq(id, parsed.data);
    if (!faq) return jsonError("FAQ not found", 404);
    return jsonOk(faq);
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
    const ok = await deleteFaq(id);
    if (!ok) return jsonError("FAQ not found", 404);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
