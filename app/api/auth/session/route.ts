import { getCustomerSession } from "@/lib/auth/customer-session";
import { findCustomerById } from "@/lib/db";
import { publicCustomer } from "@/lib/auth/customer";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return jsonOk({ session: null, customer: null });
  const customer = await findCustomerById(session.sub);
  if (!customer || !customer.active) return jsonOk({ session: null, customer: null });
  return jsonOk({
    session: { email: session.email, name: session.name, emailVerified: session.emailVerified },
    customer: publicCustomer(customer),
  });
}
