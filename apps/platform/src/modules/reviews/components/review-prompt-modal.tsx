import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { orderQueryOptions } from "@/modules/orders";
import { submitReview } from "../api/reviews-api";
import ReferralNudge from "./referral-nudge";

type Step = "rate" | "low-rating-feedback" | "referral-nudge" | "thanks";

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          aria-label={`${n} star`}
          data-testid={`review-star-${n}`}
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          type="button"
          className="cursor-pointer p-1"
        >
          <Star
            className={
              n <= (hover || value)
                ? "fill-primary text-primary"
                : "fill-border text-border"
            }
            size={34}
            strokeWidth={0}
          />
        </button>
      ))}
    </div>
  );
}

/** Post-delivery review popup — rate the order, then branch: rating >= 3
 * leads into a referral nudge (dark-pattern skip); rating < 3 asks what
 * went wrong instead. Closes and calls `onDone` once the flow resolves,
 * whatever path it took. */
export default function ReviewPromptModal({
  orderId,
  onDone,
}: {
  orderId: string;
  onDone: () => void;
}) {
  const [step, setStep] = useState<Step>("rate");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingReferralPrompt, setPendingReferralPrompt] = useState(false);
  const { data: order } = useQuery(orderQueryOptions(orderId));

  const rate = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const result = await submitReview(orderId, { rating });
      if (rating < 3) {
        // Low rating always gets the "what went wrong" question first —
        // the referral nudge (if this order still qualifies for one,
        // e.g. the guaranteed-first-5 window) comes after that, not instead.
        setPendingReferralPrompt(result.showReferralPrompt);
        setStep("low-rating-feedback");
      } else {
        setStep(result.showReferralPrompt ? "referral-nudge" : "thanks");
      }
    } catch {
      toast.error("Couldn't save your rating — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitLowRatingFeedback = async () => {
    setSubmitting(true);
    try {
      await submitReview(orderId, {
        rating,
        comment: feedback.trim() || undefined,
      });
      setStep(pendingReferralPrompt ? "referral-nudge" : "thanks");
    } catch {
      toast.error("Couldn't save your feedback — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && onDone()} open>
      <DialogContent className="rounded-3xl border border-border/60 bg-background p-8 text-center sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Rate your order</DialogTitle>
          <DialogDescription>
            Tell us how your recent order went.
          </DialogDescription>
        </DialogHeader>

        {/* TODO(dev): remove once the review-prompt sweep interval is back
         * to its production cadence — this is only here so testers know why
         * the popup can take up to a minute to appear after delivery. */}
        <p className="-mt-2 mb-2 rounded-full bg-accent/40 px-3 py-1 text-[10px] text-foreground/60">
          Dev note: prompts are checked every 1 min right now
        </p>

        {step === "rate" && (
          <>
            <h2 className="font-editorial text-2xl text-ink tracking-tight">
              How was your order?
            </h2>
            {order && (
              <p className="mt-1 font-semibold text-ink text-sm">
                #{order.id.slice(0, 8).toUpperCase()} —{" "}
                {order.items.map((item) => item.name).join(", ")}
              </p>
            )}
            <p className="mt-1 text-foreground/60 text-sm">
              Your feedback helps other parents shop with confidence.
            </p>
            <div className="mt-6">
              <StarPicker onChange={setRating} value={rating} />
            </div>
            <Button
              className="mt-6 w-full rounded-full"
              data-testid="review-submit-rating"
              disabled={rating === 0 || submitting}
              onClick={rate}
            >
              {submitting ? "Saving…" : "Submit"}
            </Button>
          </>
        )}

        {step === "low-rating-feedback" && (
          <>
            <h2 className="font-editorial text-2xl text-ink tracking-tight">
              What went wrong?
            </h2>
            <p className="mt-1 text-foreground/60 text-sm">
              We're sorry to hear that — tell us what happened so we can do
              better.
            </p>
            <textarea
              className="mt-4 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-ring"
              data-testid="review-low-rating-feedback"
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what happened…"
              rows={4}
              value={feedback}
            />
            <Button
              className="mt-4 w-full rounded-full"
              data-testid="review-submit-feedback"
              disabled={submitting}
              onClick={submitLowRatingFeedback}
            >
              {submitting ? "Saving…" : "Submit"}
            </Button>
          </>
        )}

        {step === "referral-nudge" && (
          <ReferralNudge onDone={onDone} orderId={orderId} rating={rating} />
        )}

        {step === "thanks" && (
          <>
            <h2 className="font-editorial text-2xl text-ink tracking-tight">
              Thanks for letting us know
            </h2>
            <p className="mt-1 text-foreground/60 text-sm">
              We'll use this to make Mumzo better.
            </p>
            <Button className="mt-6 w-full rounded-full" onClick={onDone}>
              Close
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
