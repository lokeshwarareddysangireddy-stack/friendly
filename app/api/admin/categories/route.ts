import { createCategory, getCategoryBySlug, listCategories } from "@/lib/db";
import { categoryInputSchema } from "@/lib/validation/schemas";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { revalidatePublicContent } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const categories = await listCategories({ includeInactive: true });
    return jsonOk({ items: categories });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const parsed = categoryInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Please correct the highlighted fields", 422, {
        fields: zodFields(parsed.error),
      });
    }
    const data = parsed.data;
    const slug = data.slug?.trim() || slugify(data.name);
    if (await getCategoryBySlug(slug)) {
      return jsonError("A category with this slug already exists", 409);
    }
    const category = await createCategory({ ...data, slug });
    revalidatePublicContent();
    return jsonOk(category, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
