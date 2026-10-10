import { SectionHeading } from "@/components/ui/SectionHeading";
import { Accordion } from "@/components/ui/Accordion";
import { EmptyState } from "@/components/ui/EmptyState";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import type { FAQDoc } from "@/types";

export function FaqSection({
  faqs,
  limit,
  showHeading = true,
}: {
  faqs: FAQDoc[];
  limit?: number;
  showHeading?: boolean;
}) {
  const items = (limit ? faqs.slice(0, limit) : faqs).map((f) => ({
    id: f._id,
    question: f.question,
    answer: f.answer,
  }));

  return (
    <section className="container-page py-16 lg:py-20" id="faq">
      {showHeading && (
        <SectionHeading
          eyebrow="Good to know"
          title="Frequently asked questions"
          description="Everything you need to know about ordering, delivery and payments."
          action={{ label: "All questions", href: "/faq" }}
          align="left"
        />
      )}
      <div className="mt-8">
        {items.length ? (
          <Accordion items={items} />
        ) : (
          <EmptyState
            icon={<HelpCircle className="h-6 w-6" />}
            title="FAQs are being prepared"
            description="Reach out on WhatsApp and we will answer any question you have."
            action={
              <Link
                href="/contact"
                className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-white"
              >
                Contact us
              </Link>
            }
          />
        )}
      </div>
    </section>
  );
}
