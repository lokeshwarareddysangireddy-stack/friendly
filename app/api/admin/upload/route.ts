import { isCloudinaryConfigured, uploadImage } from "@/lib/cloudinary";
import { requireApiSession } from "@/lib/auth/guard";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    if (!isCloudinaryConfigured()) {
      return jsonError(
        "Image uploads are disabled until Cloudinary is configured. You can still paste an image URL directly.",
        503
      );
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("No file provided", 422);

    const result = await uploadImage(file);
    return jsonOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    if (/Only JPEG|smaller than/.test(message)) {
      return jsonError(message, 422);
    }
    return handleRouteError(error);
  }
}
