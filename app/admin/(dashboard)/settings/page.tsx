import { AdminHeading } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <AdminHeading
        title="Settings"
        description="Announcements, promo copy and public contact details."
      />
      <SettingsForm initial={settings} />
    </>
  );
}
