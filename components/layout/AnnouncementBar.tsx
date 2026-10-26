import { Sparkles } from "lucide-react";

export function AnnouncementBar({
  enabled,
  text,
}: {
  enabled: boolean;
  text: string;
}) {
  if (!enabled || !text) return null;
  return (
    <div className="relative overflow-hidden bg-forest text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(120% 200% at 0% 0%, rgba(101,217,20,0.28) 0%, transparent 45%), radial-gradient(120% 200% at 100% 0%, rgba(34,197,94,0.32) 0%, transparent 45%)",
        }}
        aria-hidden
      />
      <p className="sr-only">{text}</p>
      <div className="announcement-track relative flex w-max py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/95 sm:text-xs" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex min-w-[100vw] shrink-0 items-center justify-around gap-12 px-6">
            {[0, 1].map((item) => (
              <span key={item} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-lime" />
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
