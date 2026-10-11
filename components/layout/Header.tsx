"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingCart,
  X,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useCart } from "@/components/cart/cart-context";
import { cn } from "@/lib/utils";

export interface NavCategory {
  name: string;
  slug: string;
}

interface SearchResult {
  _id: string;
  name: string;
  slug: string;
  price: number;
  categorySlug: string;
}

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "glass border-line shadow-[0_18px_44px_-32px_rgba(6,78,32,0.75)]"
            : "border-transparent bg-white/70 backdrop-blur-md"
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            <NavLink href="/" active={pathname === "/"}>
              Home
            </NavLink>
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition",
                  pathname.startsWith("/services") || pathname.startsWith("/category")
                    ? "text-deep"
                    : "text-forest/80 hover:bg-pale hover:text-forest"
                )}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                onClick={() => setServicesOpen((v) => !v)}
              >
                Services
                <ChevronDown
                  className={cn("h-4 w-4 transition", servicesOpen && "rotate-180")}
                />
              </button>
              {servicesOpen && (
                <div className="absolute left-0 top-full z-50 w-72 pt-2">
                  <div className="overflow-hidden rounded-3xl border border-line bg-white p-2 shadow-[0_30px_60px_-30px_rgba(6,78,32,0.5)]">
                    {categories.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/services/${c.slug}`}
                        className="block rounded-2xl px-4 py-3 text-sm font-medium text-forest/80 transition hover:bg-pale hover:text-forest"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {NAV_LINKS.slice(1).map((l) => (
              <NavLink key={l.href} href={l.href} active={pathname === l.href}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2.5 rounded-full border border-line bg-surface/80 px-4 py-2.5 text-sm font-medium text-muted transition hover:border-brand/40 hover:bg-white xl:flex"
              aria-label="Search products"
            >
              <Search className="h-4 w-4 text-deep" />
              <span className="w-44 text-left">Search biryani, groceries…</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest transition hover:bg-pale xl:hidden"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/cart"
              aria-label={`Shopping cart, ${count} items`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-forest transition hover:bg-pale"
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest transition hover:bg-pale lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[70] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-2 text-forest hover:bg-pale"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav
              className="flex-1 overflow-y-auto px-3 py-4"
              aria-label="Mobile"
            >
              <MobileLink href="/" active={pathname === "/"}>
                Home
              </MobileLink>
              <p className="px-4 pb-1 pt-4 text-xs font-bold uppercase tracking-widest text-muted">
                Services
              </p>
              {categories.map((c) => (
                <MobileLink
                  key={c.slug}
                  href={`/services/${c.slug}`}
                  active={pathname === `/services/${c.slug}`}
                >
                  {c.name}
                </MobileLink>
              ))}
              <div className="my-2 h-px bg-line" />
              {NAV_LINKS.slice(1).map((l) => (
                <MobileLink key={l.href} href={l.href} active={pathname === l.href}>
                  {l.label}
                </MobileLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {searchOpen && (
        <SearchDialog
          onClose={() => setSearchOpen(false)}
          onSelect={(slug) => {
            setSearchOpen(false);
            router.push(`/product/${slug}`);
          }}
          onSubmit={(q) => {
            setSearchOpen(false);
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        />
      )}
    </>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3.5 py-2 text-sm font-semibold transition",
        active ? "text-deep" : "text-forest/80 hover:bg-pale hover:text-forest"
      )}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl px-4 py-3 text-base font-semibold transition",
        active ? "bg-pale text-forest" : "text-forest/80 hover:bg-surface"
      )}
    >
      {children}
    </Link>
  );
}

function SearchDialog({
  onClose,
  onSelect,
  onSubmit,
}: {
  onClose: () => void;
  onSelect: (slug: string) => void;
  onSubmit: (q: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=6`, {
          signal: controller.signal,
        });
        const json = await res.json();
        setResults(json?.data?.items ?? []);
      } catch {
        // aborted or failed
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
      setLoading(false);
    };
  }, [query]);

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Search products">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-20 w-[92%] max-w-xl -translate-x-1/2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) onSubmit(query.trim());
          }}
          className="overflow-hidden rounded-3xl border border-line bg-white shadow-2xl"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="h-5 w-5 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for biryani, groceries, pizza..."
              className="h-10 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
              aria-label="Search products"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="rounded-full p-1.5 text-muted hover:bg-surface"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {query.trim().length >= 2 && (
            <div className="border-t border-line">
              {results.length > 0 ? (
                <ul className="max-h-80 overflow-y-auto p-2">
                  {results.map((r) => (
                    <li key={r._id}>
                      <button
                        type="button"
                        onClick={() => onSelect(r.slug)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-pale"
                      >
                        <span className="text-sm font-semibold text-forest">
                          {r.name}
                        </span>
                        <span className="text-xs font-bold text-deep">
                          {"\u20B9"}
                          {(r.price / 100).toFixed(0)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                !loading && (
                  <p className="px-4 py-6 text-center text-sm text-muted">
                    No products matched &ldquo;{query}&rdquo;.
                  </p>
                )
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
