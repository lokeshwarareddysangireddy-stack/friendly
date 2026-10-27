export default function Loading() {
  return <div className="container-page py-12" role="status" aria-label="Loading products and categories">
    <div className="mb-8 h-12 w-2/3 animate-pulse rounded-xl bg-surface" />
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }, (_, index) => <div key={index} className="aspect-square animate-pulse rounded-3xl bg-surface" />)}
    </div>
    <span className="sr-only">Loading…</span>
  </div>;
}
