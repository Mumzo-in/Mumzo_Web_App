import { cn } from "@mumzo/ui/lib/utils";

import { FREE_DELIVERY_OVER, rupee, useCart } from "../../store/cart-provider";

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground/70">{label}</span>
      <span className={cn(highlight && "font-medium text-pinkDeep")}>
        {value}
      </span>
    </div>
  );
}

interface CartSummaryProps {
  onPlaceOrder: () => void;
  ctaLabel?: string;
  /** Extra fee for a scheduled (non-express) delivery slot, if any. */
  slotFee?: number;
}

export default function CartSummary({
  onPlaceOrder,
  ctaLabel,
  slotFee = 0,
}: CartSummaryProps) {
  const { totals, coupon } = useCart();
  const total = totals.total + slotFee;

  return (
    <aside className="h-fit lg:sticky lg:top-24">
      <div className="rounded-3xl border border-border/60 bg-white p-6">
        <p className="mb-4 font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
          Bill details
        </p>
        <div className="flex flex-col gap-2.5 text-sm">
          <Row label="Item total (MRP)" value={rupee(totals.mrpTotal)} />
          {totals.savings > 0 && (
            <Row
              label="Product discount"
              value={`− ${rupee(totals.savings)}`}
              highlight
            />
          )}
          {totals.discount > 0 && (
            <Row
              label={`Coupon (${coupon?.code})`}
              value={`− ${rupee(totals.discount)}`}
              highlight
            />
          )}
          <Row
            label="Delivery fee"
            value={totals.delivery === 0 ? "FREE" : rupee(totals.delivery)}
            highlight={totals.delivery === 0}
          />
          {slotFee > 0 && (
            <Row label="Scheduled delivery fee" value={rupee(slotFee)} />
          )}
          <Row label="GST & taxes (5%)" value={rupee(totals.gst)} />
          <div className="mt-3 flex items-center justify-between border-border/50 border-t pt-3">
            <span className="font-semibold">To pay</span>
            <span
              data-testid="web-cart-total"
              className="font-editorial font-semibold text-2xl"
            >
              {rupee(total)}
            </span>
          </div>
        </div>
        {totals.savings + totals.discount > 0 && (
          <div className="mt-4 rounded-xl bg-blush px-4 py-2.5 text-center font-medium text-pinkDeep text-xs">
            You save {rupee(totals.savings + totals.discount)} on this order 🎉
          </div>
        )}
        <button
          type="button"
          onClick={onPlaceOrder}
          data-testid="web-place-order"
          className="mt-6 w-full rounded-full bg-pinkDeep py-4 font-semibold text-sm text-white transition-all hover:bg-[#A93F63] active:scale-[0.99]"
        >
          {ctaLabel ?? `Place order → ${rupee(total)}`}
        </button>
        <p className="mt-3 text-center text-[11px] text-foreground/50">
          By placing your order, you agree to our terms of service and refund
          policy.
        </p>
      </div>

      {totals.subtotal < FREE_DELIVERY_OVER && (
        <div className="mt-4 rounded-2xl border border-border/50 bg-pinkSoft p-4 text-foreground/70 text-xs">
          <p className="mb-1 font-semibold text-foreground">
            Free delivery over {rupee(FREE_DELIVERY_OVER)}
          </p>
          <p>
            Add {rupee(FREE_DELIVERY_OVER - totals.subtotal)} more to unlock
            free delivery.
          </p>
        </div>
      )}
    </aside>
  );
}
