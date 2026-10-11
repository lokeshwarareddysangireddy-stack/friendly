import { LayoutGrid } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryCard } from "@/components/services/CategoryCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { WA_TEMPLATES } from "@/lib/whatsapp";
import type { CategoryDoc } from "@/types";

export function ServiceCategories({
  categories,
  productCounts,
  whatsappNumber,
}: {
  categories: CategoryDoc[];
  productCounts?: Record<string, number>;
  whatsappNumber?: string;
}) {
  if (!categories.length) {
    return (
      <section className="container-page py-16 lg:py-20">
        <EmptyState
          icon={<LayoutGrid className="h-6 w-6" />}
          title="Our services are being updated"
          description="Our categories are taking a short break while we refresh them. Message us and we will help you order right away."
          action={
            <WhatsAppLink
              message={WA_TEMPLATES.general}
              number={whatsappNumber}
            >
              Enquire on WhatsApp
            </WhatsAppLink>
          }
        />
      </section>
    );
  }

  return (
    <section className="container-page py-16 lg:py-20">
      <SectionHeading
        eyebrow="What we deliver"
        title="Ways Friendly Basket helps you"
        description="Choose a service to browse available items, or send a WhatsApp enquiry for something specific."
        action={{ label: "All services", href: "/services" }}
        align="left"
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => (
          <Reveal key={category._id} delay={index * 70}>
            <CategoryCard
              category={category}
              productCount={productCounts?.[category.slug]}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
