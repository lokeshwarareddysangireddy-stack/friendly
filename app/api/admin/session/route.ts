import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);
  return jsonOk({ session });
}
