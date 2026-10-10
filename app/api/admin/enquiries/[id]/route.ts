import { z } from "zod";
import { deleteEnquiry, updateEnquiry } from "@/lib/db";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["new", "contacted", "closed"]),
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
      return jsonError("Invalid status", 422, { fields: zodFields(parsed.error) });
    }
    const enquiry = await updateEnquiry(id, parsed.data);
    if (!enquiry) return jsonError("Enquiry not found", 404);
    return jsonOk(enquiry);
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
    const ok = await deleteEnquiry(id);
    if (!ok) return jsonError("Enquiry not found", 404);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
