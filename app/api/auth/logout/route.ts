import { clearCustomerSessionCookie } from "@/lib/auth/customer-session";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearCustomerSessionCookie();
  return jsonOk({ loggedOut: true });
}
