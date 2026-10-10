import { clearSessionCookie } from "@/lib/auth/guard";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearSessionCookie();
  return jsonOk({ loggedOut: true });
}
