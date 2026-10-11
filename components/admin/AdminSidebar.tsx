"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  MapPin,
  HelpCircle,
  Megaphone,
  Star,
  Settings,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Delivery Zones", href: "/admin/zones", icon: MapPin },
  { label: "FAQs", href: "/admin/faqs", icon: HelpCircle },
  { label: "Promotions", href: "/admin/promotions", icon: Megaphone },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin">
      {NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-brand text-white"
                : "text-forest/80 hover:bg-pale hover:text-forest"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest hover:bg-pale"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="border-b border-line px-5 py-5">
          <Logo />
        </div>
        {nav}
        <div className="border-t border-line p-3">
          <Link
            href="/"
            target="_blank"
            className="mb-2 flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-forest/80 transition hover:bg-pale"
          >
            <ExternalLink className="h-4 w-4" />
            View storefront
          </Link>
          <div className="rounded-2xl bg-surface p-3">
            <p className="truncate text-sm font-bold text-forest">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="mt-2.5 inline-flex items-center gap-2 text-xs font-bold text-red-600 hover:underline disabled:opacity-60"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[80%] max-w-xs flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-2 text-forest hover:bg-pale"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <div className="border-t border-line p-3">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
