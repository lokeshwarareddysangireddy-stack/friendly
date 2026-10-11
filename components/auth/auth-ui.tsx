"use client";

import Link from "next/link";
import { Loader2, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-b from-pale/60 to-white py-12 sm:py-16">
      <div className="container-page flex justify-center">
        <div className="w-full max-w-md">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="mt-8 rounded-[2rem] border border-line bg-white p-6 shadow-[0_30px_70px_-50px_rgba(6,78,32,0.6)] sm:p-8">
            {Icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pale text-deep">
                <Icon className="h-6 w-6" />
              </div>
            )}
            <h1 className="mt-4 font-display text-2xl font-extrabold text-forest">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-4 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  icon: Icon,
  required = true,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  icon?: LucideIcon;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-forest">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        )}
        <input
          id={id}
          type={type}
          value={value}
          required={required}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-12 w-full rounded-2xl border border-line bg-white pr-4 text-sm outline-none transition focus:border-brand",
            Icon ? "pl-10" : "pl-4"
          )}
        />
      </div>
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </p>
  );
}

export function FormNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand/30 bg-pale/60 px-4 py-3 text-sm text-forest">
      {children}
    </div>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export { Link };
