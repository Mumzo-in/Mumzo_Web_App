import { Badge } from "@mumzo/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Check, Copy, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { COUPON_STATUS_META, type ReferralCoupon } from "../data/referral-data";

/** The user's earned referral coupons — one per tier milestone reached. */
export default function CouponList({ coupons }: { coupons: ReferralCoupon[] }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h2 className="font-editorial text-ink text-xl">Your coupons</h2>

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
            <CouponRow key={coupon.id} coupon={coupon} />
          ))}
        </div>
      )}
    </div>
  );
}

function CouponRow({ coupon }: { coupon: ReferralCoupon }) {
  const [copied, setCopied] = useState(false);
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
            {coupon.status === "used" && coupon.usedAt
              ? `Used on ${coupon.usedAt}`
              : `Expires ${coupon.expiresAt}`}
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
    </div>
  );
}
