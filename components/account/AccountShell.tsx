"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Lock,
  MapPin,
  Package,
  UserRound,
} from "lucide-react";
import { useCustomer } from "@/components/auth/customer-context";
import { FormNotice } from "@/components/auth/auth-ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/password", label: "Password", icon: Lock },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, logout } = useCustomer();
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/auth/verify-email/resend", { method: "POST" });
      const json = await res.json();
      if (json?.data?.verificationUrl) setVerifyUrl(json.data.verificationUrl);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const onLogout = async () => {
    await logout();
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="bg-gradient-to-b from-pale/40 to-white">
      <div className="container-page py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside>
            <div className="rounded-3xl border border-line bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pale text-lg font-bold text-deep">
                  {(customer?.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-forest">
                    {customer?.name || "Your account"}
                  </p>
                  <p className="truncate text-xs text-muted">{customer?.email}</p>
                </div>
              </div>
              {customer && !customer.emailVerified && (
                <div className="mt-4">
                  <FormNotice>
                    <p className="text-xs font-semibold text-amber-700">Verify your email</p>
                    <p className="mt-1 text-xs text-muted">
                      Confirm your email to place orders.
                    </p>
                    <button
                      type="button"
                      onClick={resend}
                      disabled={sending}
                      className="mt-2 text-xs font-bold text-deep hover:underline disabled:opacity-60"
                    >
                      {sending ? "Sending…" : "Resend verification"}
                    </button>
                    {verifyUrl && (
                      <Link href={verifyUrl} className="mt-1 block break-all text-xs font-semibold text-deep hover:underline">
                        Open verification link
                      </Link>
                    )}
                  </FormNotice>
                </div>
              )}
              <nav className="mt-5 space-y-1">
                {NAV.map((item) => {
                  const active =
                    item.href === "/wishlist"
                      ? pathname === "/wishlist"
                      : pathname === item.href ||
                        (item.href !== "/account" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition",
                        active ? "bg-pale text-forest" : "text-forest/75 hover:bg-surface"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </nav>
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
