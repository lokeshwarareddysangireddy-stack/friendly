import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  tone?: "brand" | "lime" | "forest" | "amber" | "muted" | "red" | "blue";
  className?: string;
}) {
  const tones = {
    brand: "bg-pale text-deep",
    lime: "bg-[#eaf9d6] text-forest",
    forest: "bg-forest text-white",
    amber: "bg-amber-50 text-amber-700",
    muted: "bg-surface text-muted",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
