import { cn } from "@mumzo/ui/lib/utils";
import { Check, Lock, PartyPopper } from "lucide-react";

import {
  currentTier,
  nextTier,
  type ReferralProgram,
  referralsToNext,
} from "../data/referral-data";
import ConfettiBurst from "./confetti-burst";

/**
 * The tier ladder — a vertical milestone track. Each circle is a referral
 * count; reaching it unlocks that tier's coupon. Minimal by design: the
 * number + reward carry the meaning, no supporting paragraphs.
 */
export default function TierLadder({
  program,
  locked = false,
}: {
  program: ReferralProgram;
  /** Guest view — every milestone renders locked, no progress copy. */
  locked?: boolean;
}) {
  const upcoming = nextTier(program);
  const remaining = referralsToNext(program);
  const latestUnlocked = !locked ? currentTier(program) : null;

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-editorial text-ink text-xl">Reward tiers</h2>
        {!locked && (
          <p className="font-semibold text-ink text-sm">
            {program.successfulReferrals} referred
          </p>
        )}
      </div>

      <p className="mt-1 text-muted-foreground text-xs">
        {locked
          ? "Sign up to start unlocking coupons."
          : upcoming
            ? `${remaining} more to unlock ₹${upcoming.reward.amount}`
            : "All tiers unlocked 💜"}
      </p>

      <div className="mt-6 flex flex-col">
        {program.tiers.map((tier, index) => {
          const unlocked =
            !locked && program.successfulReferrals >= tier.threshold;
          const isNext = !locked && upcoming?.id === tier.id;
          const isLast = index === program.tiers.length - 1;
          const isLatest = latestUnlocked?.id === tier.id;

          return (
            <div
              className="flex gap-4"
              key={tier.id}
              data-testid={`referral-tier-${tier.id}`}
            >
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "relative flex size-11 shrink-0 items-center justify-center rounded-full font-semibold text-sm transition-colors",
                    unlocked
                      ? "bg-primary text-primary-foreground"
                      : isNext
                        ? "bg-accent text-ink ring-2 ring-primary/40"
                        : "bg-secondary text-foreground/40",
                    isLatest && "ring-4 ring-accent",
                  )}
                >
                  {isLatest && <ConfettiBurst />}
                  {unlocked ? <Check size={18} /> : <Lock size={14} />}
                </span>
                {!isLast && (
                  <span
                    className={cn(
                      "my-1 w-0.5 flex-1",
                      unlocked ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>

              <div
                className={cn("flex items-center gap-2 pb-6", isLast && "pb-0")}
              >
                <div>
                  <p className="font-editorial text-ink text-lg">
                    ₹{tier.reward.amount}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {tier.threshold} referral{tier.threshold === 1 ? "" : "s"}
                  </p>
                </div>
                {isLatest && (
                  <span
                    className="flex items-center gap-1 rounded-full bg-accent/60 px-2 py-0.5 font-semibold text-[10px] text-ink"
                    data-testid="referral-tier-unlocked-badge"
                  >
                    <PartyPopper size={11} />
                    Unlocked!
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
