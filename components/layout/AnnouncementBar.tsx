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
      <div className="container-wide relative flex items-center justify-center gap-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/95 sm:text-xs">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-lime" aria-hidden />
        <p className="truncate">{text}</p>
      </div>
    </div>
  );
}
