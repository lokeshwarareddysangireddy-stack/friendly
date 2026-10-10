import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-line/60", className)}
      aria-hidden
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3 rounded-3xl border border-line bg-white p-3">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-9 w-full rounded-full" />
    </div>
  );
}
