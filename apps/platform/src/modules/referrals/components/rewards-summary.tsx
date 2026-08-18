import { PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import ConfettiBurst from "./confetti-burst";

/**
 * The headline "here's what you've earned by referring" moment — big, bold,
 * celebratory (confetti on mount). Deliberately just two numbers: your total
 * earnings and how many successful referrals produced them — everything
 * else (welcome coupon, order savings) lives elsewhere so this card reads as
 * "your referral track record," not a catch-all savings tally.
 */
export default function RewardsSummary({
  referrerEarnings,
  successfulReferrals,
}: {
  /** Tier coupons earned by referring friends who then ordered. */
  referrerEarnings: number;
  successfulReferrals: number;
}) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (referrerEarnings <= 0) return;
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 1200);
    return () => clearTimeout(timer);
  }, [referrerEarnings]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-accent/50 via-card to-sage/30 p-8 text-center sm:p-10"
      data-testid="rewards-summary"
    >
      {showConfetti && <ConfettiBurst />}

      <p className="kicker text-primary">Your earnings</p>
      <p className="mt-3 flex items-center justify-center gap-2 font-editorial text-6xl text-ink tracking-tighter sm:text-7xl">
        <PartyPopper
          className="shrink-0 text-primary"
          size={40}
          strokeWidth={1.5}
        />
        <span data-testid="rewards-total-saved">₹{referrerEarnings}</span>
      </p>
      <p className="mt-2 font-semibold text-foreground/70 text-sm">
        earned by referring friends
      </p>

      <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-white/70 p-4">
          <p className="font-editorial text-2xl text-ink tracking-tight">
            ₹{referrerEarnings}
          </p>
          <p className="mt-0.5 text-foreground/60 text-xs">Total earnings</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white/70 p-4">
          <p className="font-editorial text-2xl text-ink tracking-tight">
            {successfulReferrals}
          </p>
          <p className="mt-0.5 text-foreground/60 text-xs">
            Successful referrals
          </p>
        </div>
      </div>
    </div>
  );
}
