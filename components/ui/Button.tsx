import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "whatsapp" | "dark";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_12px_26px_-12px_rgba(34,197,94,0.9)] hover:bg-brand-600",
  secondary: "bg-pale text-forest hover:bg-[#e6f7d8]",
  outline: "border border-line bg-white text-forest hover:border-brand hover:bg-pale",
  ghost: "text-forest hover:bg-pale",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1ebe5a]",
  dark: "bg-forest text-white hover:bg-deep",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
  icon: "h-10 w-10",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}
