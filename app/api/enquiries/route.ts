import { createEnquiry } from "@/lib/db";
import { enquirySchema } from "@/lib/validation/schemas";
import { buildEnquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`enquiry:${ip}`, 12, 60_000).allowed) {
      return jsonError("Too many enquiries. Please try again shortly.", 429);
    }

    const body = await request.json();
    const parsed = enquirySchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fields[key]) fields[key] = issue.message;
      }
      return jsonError("Please correct the highlighted fields", 422, { fields });
    }

    const enquiry = await createEnquiry(parsed.data);
    const message = buildEnquiryMessage(parsed.data);

    return jsonOk({
      enquiryId: enquiry._id,
      message,
      whatsappUrl: buildWhatsAppUrl(message),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
