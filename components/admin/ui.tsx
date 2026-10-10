import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-11 w-full rounded-2xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-brand";

export const textareaClass =
  "w-full rounded-2xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand";

export const selectClass =
  "h-11 w-full rounded-2xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-brand";

export function AdminHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-forest">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-line bg-white p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted"
    >
      {children}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-forest"
      aria-pressed={checked}
    >
      {label}
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-brand" : "bg-line"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "brand" | "amber";
}) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-extrabold",
          tone === "brand" && "text-brand",
          tone === "amber" && "text-amber-600",
          tone === "default" && "text-forest"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function DangerButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
