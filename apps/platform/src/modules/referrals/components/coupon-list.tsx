import { Badge } from "@mumzo/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Check, Copy, Gift, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  COUPON_STATUS_META,
  formatCouponDate,
  type ReferralCoupon,
} from "../data/referral-data";

/** The user's earned referral coupons — one per tier milestone reached.
 * `onClaim` is only relevant for tier coupons that can be issued unclaimed
 * (admin's "claim on delivery" setting) — omit it for coupon lists that
 * never contain a `claimable` entry. */
export default function CouponList({
  coupons,
  title = "Your coupons",
  onClaim,
}: {
  coupons: ReferralCoupon[];
  title?: string;
  onClaim?: (couponId: string) => Promise<void>;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h2 className="font-editorial text-ink text-xl">{title}</h2>

      {coupons.length === 0 ? (
        <Empty className="mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Ticket />
            </EmptyMedia>
            <EmptyTitle className="font-editorial text-base text-ink">
              No coupons yet
            </EmptyTitle>
            <EmptyDescription>
              Start referring friends to unlock your first coupon.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {coupons.map((coupon) => (
            <CouponRow coupon={coupon} key={coupon.id} onClaim={onClaim} />
          ))}
        </div>
      )}
    </div>
  );
}

function CouponRow({
  coupon,
  onClaim,
}: {
  coupon: ReferralCoupon;
  onClaim?: (couponId: string) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const meta = COUPON_STATUS_META[coupon.status];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
    } catch {
      // clipboard may be unavailable
    }
    setCopied(true);
    toast.success(`Copied ${coupon.code}`);
    setTimeout(() => setCopied(false), 1500);
  };

  const claim = async () => {
    if (!onClaim) return;
    setClaiming(true);
    try {
      await onClaim(coupon.id);
      toast.success("Coupon claimed — check its expiry above.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't claim this coupon.",
      );
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
      data-testid={`referral-coupon-${coupon.id}`}
    >
      <div className="flex items-center gap-4">
        <span className="shrink-0 font-editorial text-ink text-xl sm:text-2xl">
          ₹{coupon.discountAmount} OFF
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-editorial text-ink text-lg tracking-wide">
              {coupon.code}
            </p>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>
          <p className="mt-0.5 text-foreground/55 text-xs">
            {coupon.status === "claimable"
              ? "Claim it to start its validity window."
              : coupon.status === "used" && coupon.usedAt
                ? `Used on ${formatCouponDate(coupon.usedAt)}`
                : coupon.expiresAt
                  ? `Expires ${formatCouponDate(coupon.expiresAt)}`
                  : null}
          </p>
        </div>
      </div>

      {coupon.status === "active" && (
        <button
          type="button"
          onClick={copy}
          data-testid={`referral-coupon-copy-${coupon.id}`}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      )}

      {coupon.status === "claimable" && onClaim && (
        <button
          type="button"
          onClick={claim}
          disabled={claiming}
          data-testid={`referral-coupon-claim-${coupon.id}`}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Gift size={14} />
          {claiming ? "Claiming…" : "Claim"}
        </button>
      )}
    </div>
  );
}
