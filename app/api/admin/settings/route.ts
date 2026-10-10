import { getSettings, updateSettings } from "@/lib/db";
import { settingsInputSchema } from "@/lib/validation/schemas";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const settings = await getSettings();
    return jsonOk(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const parsed = settingsInputSchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Please correct the highlighted fields", 422, {
        fields: zodFields(parsed.error),
      });
    }
    const settings = await updateSettings(parsed.data);
    return jsonOk(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}
