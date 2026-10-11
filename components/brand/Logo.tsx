import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  variant = "dark",
  showText = true,
  href = "/",
}: {
  className?: string;
  variant?: "dark" | "light";
  showText?: boolean;
  href?: string | null;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[0_8px_20px_-8px_rgba(6,78,32,0.6)]">
        <Image
          src="/images/logo.png"
          alt="Friendly Basket logo"
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
          priority
        />
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-lg font-extrabold tracking-tight",
              variant === "dark" ? "text-forest" : "text-white"
            )}
          >
            Friendly Basket
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.18em]",
              variant === "dark" ? "text-deep" : "text-lime"
            )}
          >
            Local Delivery Partner
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="Friendly Basket home" className="group">
      {content}
    </Link>
  );
}
