import { createFileRoute, notFound } from "@tanstack/react-router";
import { CheckCircle2, Star, ThumbsUp } from "lucide-react";
import { useState } from "react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  productQueryOptions,
  type Review,
  reviewSummary,
  seedReviews,
  toProduct,
} from "@/modules/catalog";

export const Route = createFileRoute("/(store)/product/$productId/reviews")({
  component: ProductReviewsPage,
  loader: async ({ params, context }) => {
    const raw = await context.queryClient
      .ensureQueryData(productQueryOptions(params.productId))
      .catch(() => null);
    if (!raw) throw notFound();
    return toProduct(raw);
  },
});

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={0}
          className={
            n <= value ? "fill-primary text-primary" : "fill-border text-border"
          }
        />
      ))}
    </span>
  );
}

function ProductReviewsPage() {
  const product = Route.useLoaderData();
  const [filter, setFilter] = useState<number | null>(null);

  const summary = reviewSummary(seedReviews);
  const shown: Review[] = filter
    ? seedReviews.filter((r) => r.rating === filter)
    : seedReviews;

  return (
    <div className="mx-auto max-w-[900px] px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          {
            label: product.name,
            to: "/product/$productId",
            params: { productId: product.id },
          },
          { label: "Reviews" },
        ]}
      />

      <h1 className="mb-6 font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
        Ratings & reviews
      </h1>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside className="flex h-fit flex-col gap-5 rounded-3xl border border-border/60 bg-white p-6">
          <div className="text-center">
            <p className="font-editorial text-5xl text-ink">
              {summary.average}
            </p>
            <div className="mt-2 flex justify-center">
              <Stars value={Math.round(summary.average)} size={18} />
            </div>
            <p className="mt-1 text-foreground/55 text-sm">
              {summary.total} reviews
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star];
              const pct = summary.total ? (count / summary.total) * 100 : 0;
              const active = filter === star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFilter(active ? null : star)}
                  className={`flex items-center gap-2 rounded-full px-2 py-1 text-xs transition-colors ${
                    active ? "bg-primary/10" : "hover:bg-secondary"
                  }`}
                >
                  <span className="w-3 text-foreground/70">{star}</span>
                  <Star
                    size={11}
                    strokeWidth={0}
                    className="fill-primary text-primary"
                  />
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-5 text-right text-foreground/50">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          {shown.length === 0 ? (
            <div className="rounded-3xl border border-border/60 bg-white p-10 text-center text-foreground/60 text-sm">
              No {filter}-star reviews yet.
            </div>
          ) : (
            shown.map((r) => (
              <article
                key={r.id}
                className="rounded-3xl border border-border/60 bg-white p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-full bg-accent/40 font-semibold text-ink text-sm">
                      {r.author.charAt(0)}
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 font-semibold text-ink text-sm">
                        {r.author}
                        {r.verified && (
                          <CheckCircle2 size={13} className="text-primary" />
                        )}
                      </p>
                      <p className="text-foreground/45 text-xs">{r.date}</p>
                    </div>
                  </div>
                  <Stars value={r.rating} />
                </div>
                <h3 className="mt-3 font-semibold text-ink text-sm">
                  {r.title}
                </h3>
                <p className="mt-1 text-foreground/70 text-sm leading-relaxed">
                  {r.body}
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1.5 text-foreground/55 text-xs transition-colors hover:text-primary"
                >
                  <ThumbsUp size={13} />
                  Helpful ({r.helpful})
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
