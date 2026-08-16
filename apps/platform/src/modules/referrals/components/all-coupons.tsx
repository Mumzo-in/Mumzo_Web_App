import { Badge } from "@mumzo/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { cn } from "@mumzo/ui/lib/utils";
import { Check, Copy, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { MyAssignedCoupon } from "@/modules/cart";
import { COUPON_STATUS_META, formatCouponDate } from "../data/referral-data";

/** Every coupon assigned to the customer, from every source (referral tier
 * rewards, referee welcome coupons, and any other admin-assigned coupon) —
 * one plain list, most-usable first, with claimed/expired rows greyed out
 * so status reads at a glance without needing to filter anything. */
export default function AllCoupons({
  coupons,
}: {
  coupons: MyAssignedCoupon[];
}) {
  const sorted = [...coupons].sort(
    (a, b) => statusRank(a.status) - statusRank(b.status),
  );

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h2 className="font-editorial text-ink text-xl">Your coupons</h2>

      {sorted.length === 0 ? (
        <Empty className="mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Ticket />
            </EmptyMedia>
            <EmptyTitle className="font-editorial text-base text-ink">
              No coupons yet
            </EmptyTitle>
            <EmptyDescription>
              Refer friends or shop to start earning coupons.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {sorted.map((coupon) => (
            <AllCouponsRow coupon={coupon} key={coupon.id} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Active first, then used, then expired/revoked last. */
function statusRank(status: MyAssignedCoupon["status"]): number {
  switch (status) {
    case "active":
      return 0;
    case "used":
      return 1;
    default:
      return 2;
  }
}

function AllCouponsRow({ coupon }: { coupon: MyAssignedCoupon }) {
  const [copied, setCopied] = useState(false);
  const meta = COUPON_STATUS_META[coupon.status];
  const usable = coupon.status === "active";

  const copy = async () => {
    if (!usable) return;
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
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
        usable
          ? "border-border/60 bg-card"
          : "border-border/40 bg-secondary/30",
      )}
      data-testid={`rewards-coupon-${coupon.id}`}
    >
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "shrink-0 font-editorial text-xl sm:text-2xl",
            usable ? "text-ink" : "text-foreground/40",
          )}
        >
          ₹{coupon.discountAmount} OFF
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "font-editorial text-lg tracking-wide",
                usable ? "text-ink" : "text-foreground/40 line-through",
              )}
            >
              {coupon.code}
            </p>
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {coupon.referrerName && (
              <Badge variant="outline">From {coupon.referrerName}</Badge>
            )}
          </div>
          <p className="mt-0.5 text-foreground/50 text-xs">
            {coupon.description ??
              `Min. order ₹${coupon.minAmt} · Expires ${formatCouponDate(coupon.expiresAt)}`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={copy}
        disabled={!usable}
        data-testid={`rewards-coupon-copy-${coupon.id}`}
        className={cn(
          "inline-flex w-fit shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-semibold text-sm transition-colors",
          usable
            ? "border-border bg-card text-foreground/70 hover:bg-secondary"
            : "cursor-not-allowed border-border/40 text-foreground/30",
        )}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : usable ? "Copy" : meta.label}
      </button>
    </div>
  );
}
