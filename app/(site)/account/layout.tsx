import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth/customer-session";
import { AccountShell } from "@/components/account/AccountShell";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCustomerSession();
  if (!session) redirect("/login?next=/account");
  return <AccountShell>{children}</AccountShell>;
}
