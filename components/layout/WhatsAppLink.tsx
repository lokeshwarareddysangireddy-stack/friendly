import { cn } from "@/lib/utils";
import { SITE, WHATSAPP_ICON } from "@/lib/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppLink({
  message,
  number,
  className,
  children,
  label = "Order on WhatsApp",
  variant = "button",
}: {
  message: string;
  number?: string;
  className?: string;
  children?: React.ReactNode;
  label?: string;
  variant?: "button" | "plain";
}) {
  const href = buildWhatsAppUrl(message, number);
  if (variant === "plain") {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children ?? label}
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_26px_-12px_rgba(37,211,102,0.9)] transition hover:bg-[#1ebe5a] active:scale-[0.98]",
        className
      )}
    >
      <WhatsAppGlyph className="h-4 w-4" />
      {children ?? label}
    </a>
  );
}

export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={WHATSAPP_ICON} />
    </svg>
  );
}

export const DEFAULT_WA = SITE.whatsappNumber;
