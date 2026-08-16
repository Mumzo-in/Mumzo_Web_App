import { cn } from "@mumzo/ui/lib/utils";

import {
  currentTier,
  nextTier,
  type ReferralProgram,
  referralsToNext,
} from "../data/referral-data";

/**
 * The tier ladder — a vertical dotted timeline (one rung per milestone),
 * closest in spirit to a changelog or a roadmap than a carousel. Each rung
 * shows its threshold, the reward, a one-line description, and a status
 * pill: "Unlocked" once reached, "N more to go" for the very next tier
 * still ahead, nothing beyond that.
 */
export default function TierLadder({
  program,
  locked = false,
  lockedReason = "signed-out",
}: {
  program: ReferralProgram;
  /** Every milestone renders locked, no progress copy, when true. */
  locked?: boolean;
  /** Why it's locked — drives the copy under the heading. */
  lockedReason?: "signed-out" | "no-first-order";
}) {
  const upcoming = !locked ? nextTier(program) : null;

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <p className="kicker text-muted-foreground">
        Measured in referrals, not months
      </p>

      <p className="mt-3 text-muted-foreground text-xs">
        {locked
          ? lockedReason === "no-first-order"
            ? "Place your first order to start unlocking rewards."
            : "Sign up to start unlocking rewards."
          : upcoming
            ? `${referralsToNext(program)} more to unlock ₹${upcoming.reward.amount}`
            : "All tiers unlocked 💜"}
      </p>

      <div className="mt-6 flex flex-col">
        {program.tiers.map((tier, index) => {
          const unlocked =
            !locked && program.successfulReferrals >= tier.threshold;
          const isCurrent = !locked && currentTier(program)?.id === tier.id;
          const isNext = !locked && upcoming?.id === tier.id;
          const isLast = index === program.tiers.length - 1;
          const remaining = tier.threshold - program.successfulReferrals;

          return (
            <TierRung
              isCurrent={isCurrent}
              isLast={isLast}
              isNext={isNext}
              key={tier.id}
              remaining={remaining}
              tier={tier}
              unlocked={unlocked}
            />
          );
        })}
      </div>
    </div>
  );
}

function TierRung({
  tier,
  unlocked,
  isCurrent,
  isNext,
  isLast,
  remaining,
}: {
  tier: ReferralProgram["tiers"][number];
  unlocked: boolean;
  isCurrent: boolean;
  isNext: boolean;
  isLast: boolean;
  remaining: number;
}) {
  return (
    <div className="flex gap-4" data-testid={`referral-tier-${tier.id}`}>
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "relative mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            unlocked
              ? "border-primary bg-primary"
              : "border-muted-foreground/30 bg-card",
            isCurrent &&
              "shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_15%,transparent),0_0_12px_var(--color-primary)]",
          )}
        />
        {!isLast && (
          <span
            className={cn(
              "my-1 flex-1 border-l-2",
              unlocked
                ? "border-primary border-solid"
                : "border-muted-foreground/30 border-dotted",
            )}
          />
        )}
      </div>

      <div className={cn("min-w-0 flex-1", !isLast && "pb-8")}>
        <p
          className={cn(
            "font-semibold text-xs uppercase tracking-wide",
            unlocked ? "text-primary" : "text-muted-foreground",
          )}
        >
          {tier.threshold} referral{tier.threshold === 1 ? "" : "s"}
        </p>
        <p className="mt-1 font-editorial text-ink text-lg tracking-tight">
          ₹{tier.reward.amount} coupon
        </p>
        <p className="mt-0.5 text-foreground/60 text-xs leading-relaxed">
          {tier.blurb}
        </p>

        {(unlocked || isNext) && (
          <span
            className={cn(
              "mt-3 inline-flex rounded-full px-3 py-1 font-semibold text-[11px]",
              unlocked ? "bg-sage/60 text-ink" : "bg-accent/50 text-primary",
            )}
          >
            {unlocked ? "Unlocked" : `${remaining} more to go`}
          </span>
        )}
      </div>
    </div>
  );
}
