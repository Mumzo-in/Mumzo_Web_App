import { Button } from "@mumzo/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { Gift } from "lucide-react";

import { skipReferralPrompt } from "../api/reviews-api";

/** The referral ask shown after a review — reused by both the post-delivery
 * popup and the standalone product-review page, so completing either flow
 * leads into the same nudge. Dark-pattern skip: a tiny de-emphasized link
 * next to a full-width primary CTA. */
export default function ReferralNudge({
  orderId,
  rating,
  onDone,
}: {
  orderId: string;
  /** Drives the headline copy — omit for flows with no single overall
   * rating (e.g. the per-product review page). */
  rating?: number;
  onDone: () => void;
}) {
  const navigate = useNavigate();

  const skip = async () => {
    try {
      await skipReferralPrompt(orderId);
    } catch {
      // best-effort — closing either way is fine
    }
    onDone();
  };

  const goReferAFriend = () => {
    navigate({ to: "/referrals" });
    onDone();
  };

  return (
    <>
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent/40 text-primary">
        <Gift size={26} />
      </div>
      <h2 className="mt-4 font-editorial text-2xl text-ink tracking-tight">
        {rating !== undefined && rating >= 3
          ? `Thanks for the ${rating}-star rating!`
          : "Thanks for letting us know"}
      </h2>
      <p className="mt-1 text-foreground/60 text-sm">
        Know another parent who'd love Mumzo? Refer them and you both earn
        rewards.
      </p>
      <Button
        className="mt-6 w-full rounded-full"
        data-testid="review-referral-continue"
        onClick={goReferAFriend}
      >
        Refer a friend
      </Button>
      <button
        className="mt-3 cursor-pointer text-[11px] text-muted-foreground/70 underline-offset-2 hover:underline"
        data-testid="review-referral-skip"
        onClick={skip}
        type="button"
      >
        No thanks, I don't want to earn rewards
      </button>
    </>
  );
}
