import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryCard } from "@/components/services/CategoryCard";
import type { CategoryDoc } from "@/types";

export function ServiceCategories({ categories }: { categories: CategoryDoc[] }) {
  if (!categories.length) return null;
  return (
    <section className="container-page py-16 lg:py-20">
      <SectionHeading
        eyebrow="What we deliver"
        title="Six ways Friendly Basket helps you"
        description="Choose a service to browse available items, or send a WhatsApp enquiry for something specific."
        action={{ label: "All services", href: "/services" }}
        align="left"
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => (
          <Reveal key={category._id} delay={index * 70}>
            <CategoryCard category={category} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
