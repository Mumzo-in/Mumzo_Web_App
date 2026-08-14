import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, CheckCircle2, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { OrderFormSkeleton, orderQueryOptions } from "@/modules/orders";
import {
  getReviewForOrder,
  ReferralNudge,
  submitReview,
} from "@/modules/reviews";

export const Route = createFileRoute(
  "/(store)/(protected)/orders/$orderId/review",
)({
  component: OrderReviewPage,
});

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star`}
          className="cursor-pointer p-0.5"
        >
          <Star
            size={26}
            strokeWidth={0}
            className={
              n <= (hover || value)
                ? "fill-primary text-primary"
                : "fill-border text-border"
            }
          />
        </button>
      ))}
    </div>
  );
}

function OrderReviewPage() {
  const { orderId } = Route.useParams();
  const {
    data: order,
    isLoading,
    isError,
  } = useQuery(orderQueryOptions(orderId));
  const {
    data: existingReview,
    isLoading: isReviewLoading,
    refetch: refetchReview,
  } = useQuery({
    queryKey: ["reviews", "order", orderId],
    queryFn: () => getReviewForOrder(orderId),
  });
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReferralNudge, setShowReferralNudge] = useState(false);
  // Set the instant a submit succeeds, so the "already reviewed" view shows
  // immediately without waiting on `existingReview` to refetch.
  const [justSubmitted, setJustSubmitted] = useState(false);

  const closeToOrder = () =>
    navigate({ to: "/orders/$orderId", params: { orderId } });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = Object.values(ratings);
    if (values.length === 0) {
      toast.error("Please rate at least one item");
      return;
    }

    // No single "order rating" field exists in this per-product form — the
    // average across rated items is what the order-level review row (and
    // the referral gate that reads it) uses as the overall rating.
    const overallRating = Math.round(
      values.reduce((sum, v) => sum + v, 0) / values.length,
    );
    const comment = [title.trim(), body.trim()].filter(Boolean).join(" — ");

    setSubmitting(true);
    try {
      const result = await submitReview(orderId, {
        rating: overallRating,
        comment: comment || undefined,
      });
      setJustSubmitted(true);
      refetchReview();
      if (result.showReferralPrompt) {
        setShowReferralNudge(true);
      } else {
        toast.success("Thanks for your review!");
      }
    } catch {
      toast.error("Couldn't save your review — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || isReviewLoading) {
    return <OrderFormSkeleton />;
  }

  if (isError || !order) {
    return (
      <div className="p-12 text-center">
        <h2 className="mb-4 font-editorial text-2xl">Order not found.</h2>
        <Link
          to="/orders"
          className="font-semibold text-primary hover:underline"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const shortId = order.id.slice(0, 8).toUpperCase();
  const alreadyReviewed = justSubmitted || Boolean(existingReview?.respondedAt);

  if (alreadyReviewed) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Orders", to: "/orders" },
            {
              label: `#${shortId}`,
              to: "/orders/$orderId",
              params: { orderId: order.id },
            },
            { label: "Review" },
          ]}
        />

        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-3xl border border-border/60 bg-white p-10 text-center">
          <CheckCircle2 className="text-primary" size={36} />
          <h1 className="font-editorial text-2xl text-ink tracking-tight">
            You've already reviewed this order
          </h1>
          {existingReview?.rating !== undefined &&
            existingReview?.rating !== null && (
              <div className="flex gap-1" data-testid="review-existing-rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    className={
                      n <= (existingReview.rating ?? 0)
                        ? "fill-primary text-primary"
                        : "fill-border text-border"
                    }
                    key={n}
                    size={22}
                    strokeWidth={0}
                  />
                ))}
              </div>
            )}
          {existingReview?.comment && (
            <p className="text-foreground/60 text-sm">
              "{existingReview.comment}"
            </p>
          )}
          <Button
            className="mt-3 rounded-full"
            onClick={closeToOrder}
            variant="outline"
          >
            Back to order
          </Button>
        </div>

        <Dialog
          onOpenChange={(open) => !open && closeToOrder()}
          open={showReferralNudge}
        >
          <DialogContent className="rounded-3xl border border-border/60 bg-background p-6 text-center sm:max-w-sm">
            <DialogHeader className="sr-only">
              <DialogTitle>Refer a friend</DialogTitle>
              <DialogDescription>
                Invite another parent to Mumzo and you both earn rewards.
              </DialogDescription>
            </DialogHeader>
            <ReferralNudge onDone={closeToOrder} orderId={orderId} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Orders", to: "/orders" },
          {
            label: `#${shortId}`,
            to: "/orders/$orderId",
            params: { orderId: order.id },
          },
          { label: "Review" },
        ]}
      />

      <h1 className="mb-6 font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
        Rate your order
      </h1>

      <form onSubmit={submit} className="flex max-w-xl flex-col gap-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-3xl border border-border/60 bg-white p-4"
          >
            <div className="flex-1">
              <p className="font-semibold text-ink text-sm">{item.name}</p>
              {item.variantLabel && (
                <p className="text-foreground/55 text-xs">
                  {item.variantLabel}
                </p>
              )}
            </div>
            <StarPicker
              value={ratings[item.id] ?? 0}
              onChange={(v) =>
                setRatings((prev) => ({ ...prev, [item.id]: v }))
              }
            />
          </div>
        ))}

        <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a headline"
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-ring"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Share what you liked or what could be better…"
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-ring"
          />
          <button
            type="button"
            onClick={() => toast.success("Photo upload coming soon")}
            className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
          >
            <Camera size={15} />
            Add photos
          </button>
        </div>

        <Button
          className="self-start rounded-full"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Saving…" : "Submit review"}
        </Button>
      </form>
    </div>
  );
}
