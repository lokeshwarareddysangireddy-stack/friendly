import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHero({
  title,
  description,
  breadcrumb,
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href: string }[];
}) {
  return (
    <div className="border-b border-line bg-gradient-to-b from-pale/60 to-white">
      <div className="container-page py-10 lg:py-14">
        {breadcrumb && (
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-xs font-semibold text-muted"
          >
            <Link href="/" className="hover:text-deep">
              Home
            </Link>
            {breadcrumb.map((b) => (
              <span key={b.href} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href={b.href} className="hover:text-deep">
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
        )}
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-forest sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
