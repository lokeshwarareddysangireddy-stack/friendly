import Link from "next/link";
import { Mail, Clock, MessageCircle, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { WhatsAppGlyph } from "@/components/layout/WhatsAppLink";
import { buildWhatsAppUrl, WA_TEMPLATES } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";
import type { NavCategory } from "@/components/layout/Header";

const COMPANY_LINKS = [
  { label: "All Services", href: "/services" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQs", href: "/faq" },
];

const POLICY_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
  { label: "Delivery and Cancellation", href: "/delivery-and-cancellation-policy" },
];

export function SiteFooter({
  categories,
  whatsappNumber,
  contactEmail,
  supportHours,
  address,
}: {
  categories: NavCategory[];
  whatsappNumber: string;
  contactEmail: string;
  supportHours: string;
  address: string;
}) {
  const waUrl = buildWhatsAppUrl(WA_TEMPLATES.general, whatsappNumber);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              {SITE.supportingTagline} Order online or send a message on WhatsApp.
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1ebe5a]"
            >
              <WhatsAppGlyph className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-forest">
              Services
            </h3>
            <ul className="mt-4 space-y-2.5">
              {categories.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/services/${c.slug}`}
                    className="text-sm text-muted transition hover:text-deep"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-forest">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted transition hover:text-deep"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-forest">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2.5">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-deep" />
                <span>{SITE.whatsappDisplay}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-deep" />
                <a href={`mailto:${contactEmail}`} className="hover:text-deep">
                  {contactEmail}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-deep" />
                <span>{supportHours}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-deep" />
                <span>{address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {POLICY_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-medium text-muted transition hover:text-deep"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 max-w-4xl text-xs leading-relaxed text-muted">
            Friendly Basket is a local ordering and delivery assistance service. Medicine
            items are handled as enquiries; where a valid prescription is legally
            required, it must be provided. We do not represent ourselves as a licensed
            pharmacy or a licensed medical provider unless separately confirmed in
            writing. Prices, availability and delivery charges are confirmed before an
            online order is placed.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {year} {SITE.name}. All rights reserved.
            </p>
            <p>Made for {SITE.domain}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
