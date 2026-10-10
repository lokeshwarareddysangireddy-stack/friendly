"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { WhatsAppGlyph } from "@/components/layout/WhatsAppLink";
import { buildWhatsAppUrl, WA_TEMPLATES } from "@/lib/whatsapp";

export function WhatsAppFloat({ whatsappNumber }: { whatsappNumber: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {visible && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll back to top"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-forest shadow-lg transition hover:bg-pale"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
      <a
        href={buildWhatsAppUrl(WA_TEMPLATES.general, whatsappNumber)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Friendly Basket on WhatsApp"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_-16px_rgba(37,211,102,0.9)] transition hover:scale-105"
      >
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-[#25D366]" />
        <WhatsAppGlyph className="relative h-7 w-7" />
      </a>
    </div>
  );
}
