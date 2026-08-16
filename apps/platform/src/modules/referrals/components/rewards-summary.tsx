import { PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import ConfettiBurst from "./confetti-burst";

/**
 * The headline "here's what Mumzo has saved you" moment — deliberately big,
 * bold, and celebratory (confetti on mount) so it reads as a reward, not a
 * quiet stat line. Combines referral earnings (tier coupons issued) with
 * real money saved via coupons on past orders.
 */
export default function RewardsSummary({
  referralEarnings,
  orderSavings,
}: {
  referralEarnings: number;
  orderSavings: number;
}) {
  const total = referralEarnings + orderSavings;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (total <= 0) return;
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 1200);
    return () => clearTimeout(timer);
  }, [total]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-accent/50 via-card to-sage/30 p-8 text-center sm:p-10"
      data-testid="rewards-summary"
    >
      {showConfetti && <ConfettiBurst />}

      <p className="kicker text-primary">Your rewards</p>
      <p className="mt-3 flex items-center justify-center gap-2 font-editorial text-6xl text-ink tracking-tighter sm:text-7xl">
        <PartyPopper
          className="shrink-0 text-primary"
          size={40}
          strokeWidth={1.5}
        />
        <span data-testid="rewards-total-saved">₹{total}</span>
      </p>
      <p className="mt-2 font-semibold text-foreground/70 text-sm">
        saved with Mumzo so far
      </p>

      <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-white/70 p-4">
          <p className="font-editorial text-2xl text-ink tracking-tight">
            ₹{referralEarnings}
          </p>
          <p className="mt-0.5 text-foreground/60 text-xs">
            Earned by referring friends
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white/70 p-4">
          <p className="font-editorial text-2xl text-ink tracking-tight">
            ₹{orderSavings}
          </p>
          <p className="mt-0.5 text-foreground/60 text-xs">
            Saved with coupons on orders
          </p>
        </div>
      </div>
    </div>
  );
}
