import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface px-6 py-14 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pale text-deep">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-forest">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
