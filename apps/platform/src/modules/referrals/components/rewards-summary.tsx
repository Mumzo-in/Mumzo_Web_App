import { PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import ConfettiBurst from "./confetti-burst";

/**
 * The headline "here's what Mumzo has saved you" moment — deliberately big,
 * bold, and celebratory (confetti on mount) so it reads as a reward, not a
 * quiet stat line. Breaks the total into its real sources instead of
 * lumping "referred a friend" and "was referred" under one misleading
 * "earned by referring friends" label.
 */
export default function RewardsSummary({
  referrerEarnings,
  welcomeCouponAmount,
  orderSavings,
}: {
  /** Tier coupons earned by referring friends who then ordered. */
  referrerEarnings: number;
  /** Welcome coupon(s) received for being referred — not "earned" by
   * referring anyone, so it gets its own honest label. */
  welcomeCouponAmount: number;
  orderSavings: number;
}) {
  const total = referrerEarnings + welcomeCouponAmount + orderSavings;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (total <= 0) return;
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 1200);
    return () => clearTimeout(timer);
  }, [total]);

  const tiles = [
    referrerEarnings > 0 && {
      key: "referrer",
      amount: referrerEarnings,
      label: "Earned by referring friends",
    },
    welcomeCouponAmount > 0 && {
      key: "welcome",
      amount: welcomeCouponAmount,
      label: "Your welcome coupon",
    },
    {
      key: "orders",
      amount: orderSavings,
      label: "Saved with coupons on orders",
    },
  ].filter(Boolean) as { key: string; amount: number; label: string }[];

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

      <div
        className="mx-auto mt-6 grid max-w-2xl gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(tiles.length, 3)}, minmax(0, 1fr))`,
        }}
      >
        {tiles.map((tile) => (
          <div
            className="rounded-2xl border border-border/60 bg-white/70 p-4"
            key={tile.key}
          >
            <p className="font-editorial text-2xl text-ink tracking-tight">
              ₹{tile.amount}
            </p>
            <p className="mt-0.5 text-foreground/60 text-xs">{tile.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
