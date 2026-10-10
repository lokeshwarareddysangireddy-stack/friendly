import { PageHero } from "@/components/content/PageHero";

export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalPage({
  title,
  description,
  updated,
  sections,
}: {
  title: string;
  description?: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero title={title} description={description} />
      <article className="container-page max-w-3xl py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Last updated: {updated}
        </p>
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-xl font-extrabold text-forest">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </>
  );
}
