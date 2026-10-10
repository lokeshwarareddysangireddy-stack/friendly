import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4",
        align === "center"
          ? "items-center text-center"
          : "items-start text-left md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div
        className={cn(
          "max-w-2xl",
          align === "center" ? "mx-auto" : ""
        )}
      >
        {eyebrow && (
          <span className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">
            <span
              className="h-1.5 w-1.5 rotate-45 rounded-[1px] bg-gold"
              aria-hidden
            />
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-forest text-balance sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-base leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-deep transition hover:text-forest"
        >
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
