import { Skeleton } from "@mumzo/ui/components/skeleton";

/** Stable keys for skeleton grids — count-based, never reordered. */
function skeletonKeys(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `sk-${i}`);
}

/** Matches `CategoryCard`'s aspect-[1/1.05] frame. */
export function CategoryCardSkeleton() {
  return <Skeleton className="aspect-[1/1.05] rounded-2xl" />;
}

export function CategoryGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {skeletonKeys(count).map((key) => (
        <CategoryCardSkeleton key={key} />
      ))}
    </div>
  );
}

/** Matches `ProductCard`'s image + text-block layout. */
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white">
      <Skeleton className="aspect-4/3 w-full rounded-none md:aspect-square" />
      <div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
        <div className="mt-auto flex items-center justify-between pt-3 md:pt-4">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Matches `ProductRail`'s horizontal snap-scroll sizing (w-40/48/56). */
export function ProductRailSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {skeletonKeys(count).map((key) => (
        <div key={key} className="w-40 shrink-0 sm:w-48 lg:w-56">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {skeletonKeys(count).map((key) => (
        <ProductCardSkeleton key={key} />
      ))}
    </div>
  );
}

/** Matches `BrandCard`'s avatar-circle + centered text layout. */
export function BrandCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-5">
      <Skeleton className="size-14 rounded-full" />
      <div className="flex w-full flex-col items-center gap-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function BrandGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {skeletonKeys(count).map((key) => (
        <BrandCardSkeleton key={key} />
      ))}
    </div>
  );
}

/** Matches the brands index page's row layout (avatar-circle + name/count). */
export function BrandRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-border/60 bg-white p-5">
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function BrandListSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {skeletonKeys(count).map((key) => (
        <BrandRowSkeleton key={key} />
      ))}
    </div>
  );
}
