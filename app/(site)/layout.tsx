import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import {
  getActiveCategories,
  getSettingsSafe,
} from "@/lib/public-data";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([
    getSettingsSafe(),
    getActiveCategories(),
  ]);

  const navCategories = categories.map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <AnnouncementBar
        enabled={settings.announcementEnabled}
        text={settings.announcementText}
      />
      <Header categories={navCategories} />
      <main className="flex-1">{children}</main>
      <SiteFooter
        categories={navCategories}
        whatsappNumber={settings.whatsappNumber}
        contactEmail={settings.contactEmail}
        supportHours={settings.supportHours}
        address={settings.address}
      />
      <WhatsAppFloat whatsappNumber={settings.whatsappNumber} />
    </div>
  );
}
