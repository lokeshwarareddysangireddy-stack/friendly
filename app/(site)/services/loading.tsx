import { ProductCardSkeleton } from "@/components/ui/Skeleton";

export default function ServicesLoading() {
  return (
    <>
      <div className="border-b border-line bg-gradient-to-b from-pale/60 to-white">
        <div className="container-page py-14 text-center lg:py-16">
          <span className="inline-block h-3 w-24 animate-pulse rounded-full bg-line/60" />
          <div className="mx-auto mt-4 h-10 w-full max-w-md animate-pulse rounded-2xl bg-line/60" />
          <div className="mx-auto mt-4 h-4 w-full max-w-2xl animate-pulse rounded-full bg-line/50" />
          <div className="mx-auto mt-2 h-4 w-2/3 max-w-lg animate-pulse rounded-full bg-line/50" />
        </div>
      </div>

      <section className="container-page py-16 lg:py-20">
        <div className="h-8 w-64 animate-pulse rounded-2xl bg-line/60" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-[2rem] border border-line bg-white"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-line/50" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-line/50" />
                <div className="h-4 w-1/2 animate-pulse rounded-full bg-line/50" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-4">
        <div className="rounded-[2rem] border border-line bg-surface p-6">
          <div className="h-7 w-72 animate-pulse rounded-2xl bg-line/60" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-28 animate-pulse rounded-full bg-line/50"
              />
            ))}
          </div>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </>
  );
}
