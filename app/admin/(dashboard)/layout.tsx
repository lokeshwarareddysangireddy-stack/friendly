import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-surface/60">
      <AdminSidebar name={session.name} email={session.email} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
