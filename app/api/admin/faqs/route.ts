import { createFaq, listFaqs } from "@/lib/db";
import { faqInputSchema } from "@/lib/validation/schemas";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const items = await listFaqs({});
    return jsonOk({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const parsed = faqInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Please correct the highlighted fields", 422, {
        fields: zodFields(parsed.error),
      });
    }
    const faq = await createFaq(parsed.data);
    return jsonOk(faq, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
