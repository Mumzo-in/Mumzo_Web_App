import { cn } from "@mumzo/ui/lib/utils";
import { Check, Lock } from "lucide-react";

import {
  currentTier,
  describeReward,
  nextTier,
  type ReferralProgram,
  referralsToNext,
} from "../data/referral-data";

/**
 * The tier ladder — each rung is a referral count that unlocks a reward.
 * Unlocked rungs are ticked; the next one shows how many referrals remain.
 */
export default function TierLadder({ program }: { program: ReferralProgram }) {
  const active = currentTier(program);
  const upcoming = nextTier(program);
  const remaining = referralsToNext(program);

  return (
    <div className="rounded-3xl border border-border/60 bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-editorial text-ink text-xl">Your reward tiers</h2>
        <p className="text-foreground/60 text-sm">
          <span className="font-semibold text-ink">
            {program.successfulReferrals}
          </span>{" "}
          successful referral
          {program.successfulReferrals === 1 ? "" : "s"}
        </p>
      </div>

      {upcoming ? (
        <p className="mt-1 text-foreground/60 text-sm">
          {remaining} more to unlock{" "}
          <span className="font-semibold text-ink">{upcoming.name}</span> —{" "}
          {describeReward(upcoming.reward)}.
        </p>
      ) : (
        <p className="mt-1 text-foreground/60 text-sm">
          You've unlocked every tier. Thank you 💜
        </p>
      )}

      <ol className="mt-5 flex flex-col gap-3">
        {program.tiers.map((tier) => {
          const unlocked = program.successfulReferrals >= tier.threshold;
          const isNext = upcoming?.id === tier.id;
          const isActive = active?.id === tier.id;

          return (
            <li
              key={tier.id}
              data-testid={`referral-tier-${tier.id}`}
              className={cn(
                "flex items-start gap-4 rounded-2xl border p-4 transition-colors",
                isActive
                  ? "border-primary/40 bg-blush/30"
                  : isNext
                    ? "border-primary/20 bg-accent/15"
                    : "border-border/60 bg-secondary/30",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  unlocked
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-foreground/40",
                )}
              >
                {unlocked ? <Check size={16} /> : <Lock size={14} />}
              </span>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink text-sm">{tier.name}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-[11px] text-foreground/60">
                    {tier.threshold} referral{tier.threshold === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1 text-foreground/60 text-xs leading-relaxed">
                  {tier.blurb}
                </p>
              </div>

              <span className="shrink-0 self-center font-editorial text-ink text-sm">
                {describeReward(tier.reward)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
