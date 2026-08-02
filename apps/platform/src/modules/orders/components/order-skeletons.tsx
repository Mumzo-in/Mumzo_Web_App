import { Skeleton } from "@mumzo/ui/components/skeleton";

function skeletonKeys(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `sk-${i}`);
}

/** Matches `OrderCard`'s header + divider + footer layout. */
export function OrderCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center justify-between border-border/60 border-t pt-4">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    </div>
  );
}

export function OrderListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {skeletonKeys(count).map((key) => (
        <OrderCardSkeleton key={key} />
      ))}
    </div>
  );
}

/** Matches `OrderDetailPage`'s two-column layout (status, items, address / bill, actions). */
export function OrderDetailSkeleton() {
  return (
    <div className="mx-auto pt-8 pb-16">
      <Skeleton className="mb-4 h-4 w-56" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-3.5 w-48" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-3xl border border-border/60 bg-white p-6">
            <Skeleton className="mb-4 h-5 w-32" />
            <Skeleton className="h-16 w-full" />
          </section>

          <section className="rounded-3xl border border-border/60 bg-white p-6">
            <Skeleton className="mb-4 h-5 w-20" />
            <div className="flex flex-col divide-y divide-border/60">
              {skeletonKeys(2).map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-3.5 w-14" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white p-6">
            <Skeleton className="mb-3 h-5 w-40" />
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="mt-2 h-3.5 w-full" />
            <Skeleton className="mt-2 h-3.5 w-32" />
          </section>
        </div>

        <aside className="flex h-fit flex-col gap-4">
          <div className="rounded-3xl border border-border/60 bg-white p-6">
            <Skeleton className="mb-4 h-3 w-24" />
            <div className="flex flex-col gap-3">
              {skeletonKeys(4).map((key) => (
                <Skeleton key={key} className="h-3.5 w-full" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 rounded-3xl border border-border/60 bg-white p-5">
            {skeletonKeys(4).map((key) => (
              <Skeleton key={key} className="h-11 w-full rounded-full" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Matches `OrderTrackingPage`'s map placeholder + timeline sidebar layout. */
export function OrderTrackingSkeleton() {
  return (
    <div className="mx-auto pt-8 pb-16">
      <Skeleton className="mb-4 h-4 w-64" />
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-72" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-border/60 bg-white p-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-11 w-full rounded-full" />
        </aside>
      </div>
    </div>
  );
}

/** Matches `OrderReturnPage`'s item-select + reason form layout. */
export function OrderFormSkeleton() {
  return (
    <div className="mx-auto max-w-[720px] pt-8 pb-16">
      <Skeleton className="mb-4 h-4 w-56" />
      <Skeleton className="mb-6 h-8 w-48" />

      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-border/60 bg-white p-6">
          <Skeleton className="mb-4 h-5 w-32" />
          <div className="flex flex-col gap-3">
            {skeletonKeys(2).map((key) => (
              <Skeleton key={key} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-6">
          <Skeleton className="h-5 w-24" />
          <div className="flex flex-col gap-3">
            {skeletonKeys(4).map((key) => (
              <Skeleton key={key} className="h-4 w-48" />
            ))}
          </div>
          <Skeleton className="h-20 w-full rounded-2xl" />
        </section>

        <Skeleton className="h-14 w-full rounded-full" />
      </div>
    </div>
  );
}
