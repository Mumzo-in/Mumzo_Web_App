import { cn } from "@mumzo/ui/lib/utils";
import { Check, Copy, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  formatCouponDate,
  type ReferralCoupon,
  type ReferralProgram,
} from "../data/referral-data";

/** Total rupees earned across every used-or-active tier coupon — revoked/
 * expired coupons don't count toward what the referrer actually earned. */
export function totalEarnings(coupons: ReferralCoupon[]): number {
  return coupons
    .filter((c) => c.status === "active" || c.status === "used")
    .reduce((sum, c) => sum + c.discountAmount, 0);
}

/**
 * "Your earnings" — one card per reward tier ("Referrer 1/2/3"), pairing
 * each tier with the coupon its completion unlocked. Tiers issue coupons in
 * order, so `program.coupons[i]` is tier `i`'s reward. Locked tiers show
 * progress only; unlocked tiers show the coupon code at the bottom — active
 * (copyable, tinted) or used (greyed out, copy disabled).
 */
export default function EarningsList({
  program,
}: {
  program: ReferralProgram;
}) {
  const earnings = totalEarnings(program.coupons);

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-editorial text-ink text-xl">Your earnings</h2>
        <p className="text-foreground/60 text-xs">
          Your earnings:{" "}
          <span className="font-semibold text-ink">₹{earnings}</span>
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {program.tiers.map((tier, index) => {
          const unlocked = program.successfulReferrals >= tier.threshold;
          const coupon = program.coupons[index];

          return (
            <TierEarningRow
              coupon={coupon}
              index={index}
              key={tier.id}
              tierAmount={tier.reward.amount}
              tierThreshold={tier.threshold}
              unlocked={unlocked}
            />
          );
        })}
      </div>
    </div>
  );
}

function TierEarningRow({
  index,
  tierThreshold,
  tierAmount,
  unlocked,
  coupon,
}: {
  index: number;
  tierThreshold: number;
  tierAmount: number;
  unlocked: boolean;
  coupon: ReferralCoupon | undefined;
}) {
  const used = coupon?.status === "used";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        used
          ? "border-border/40 bg-secondary/40"
          : unlocked
            ? "border-primary/30 bg-accent/20"
            : "border-border/60 bg-card",
      )}
      data-testid={`referral-earning-${index + 1}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full font-semibold text-sm",
            used
              ? "bg-secondary text-foreground/40"
              : unlocked
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground/40",
          )}
        >
          {unlocked ? (
            used ? (
              <Check size={16} />
            ) : (
              index + 1
            )
          ) : (
            <Lock size={14} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink text-sm">Referrer {index + 1}</p>
          <p className="text-foreground/55 text-xs">
            {unlocked
              ? used
                ? "Order completed — reward used"
                : "Order completed — reward ready"
              : `${tierThreshold} successful referral${tierThreshold === 1 ? "" : "s"} needed`}
          </p>
        </div>

        <span
          className={cn(
            "shrink-0 font-editorial text-lg",
            used ? "text-foreground/40" : "text-ink",
          )}
        >
          ₹{tierAmount}
        </span>
      </div>

      {unlocked && coupon && <CouponFooter coupon={coupon} rowIndex={index} />}
    </div>
  );
}

function CouponFooter({
  coupon,
  rowIndex,
}: {
  coupon: ReferralCoupon;
  rowIndex: number;
}) {
  const [copied, setCopied] = useState(false);
  const used = coupon.status === "used";

  const copy = async () => {
    if (used) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
    } catch {
      // clipboard may be unavailable
    }
    setCopied(true);
    toast.success(`Copied ${coupon.code}`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-3 flex items-center justify-between gap-3 border-border/50 border-t pt-3">
      <div className="min-w-0">
        <p
          className={cn(
            "font-editorial text-lg tracking-wide",
            used ? "text-foreground/40 line-through" : "text-ink",
          )}
        >
          {coupon.code}
        </p>
        <p className="mt-0.5 text-[11px] text-foreground/50">
          {used && coupon.usedAt
            ? `Used on ${formatCouponDate(coupon.usedAt)}`
            : `Expires ${formatCouponDate(coupon.expiresAt)}`}
        </p>
      </div>

      <button
        type="button"
        onClick={copy}
        disabled={used}
        data-testid={`referral-earning-copy-${rowIndex + 1}`}
        className={cn(
          "inline-flex w-fit shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-semibold text-sm transition-colors",
          used
            ? "cursor-not-allowed border-border/40 text-foreground/30"
            : "border-border bg-card text-foreground/70 hover:bg-secondary",
        )}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {used ? "Used" : copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
