import { cn } from "@mumzo/ui/lib/utils";

import { rupee, useCart } from "../../store/cart-provider";

function Row({
  label,
  value,
  highlight,
  strikeValue,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  /** Original (pre-discount) amount, shown struck-through in muted grey
   * right before `value` — e.g. the MRP next to the payable item total. */
  strikeValue?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground/70">{label}</span>
      <span className="flex items-center gap-1.5">
        {strikeValue && (
          <span className="text-foreground/40 line-through">{strikeValue}</span>
        )}
        <span
          className={cn(
            highlight ? "font-semibold text-[#4F7E6B]" : "text-foreground",
          )}
        >
          {value}
        </span>
      </span>
    </div>
  );
}

interface CartSummaryProps {
  onPlaceOrder: () => void;
  ctaLabel?: string;
  /** Extra fee for a scheduled (non-express) delivery slot, if any. */
  slotFee?: number;
  /** Disables the place-order button — e.g. while a placement request is
   * in flight, so a double-click can't fire it twice. */
  disabled?: boolean;
  /** Mock donation amount selected by user. */
  donation?: number;
}

export default function CartSummary({
  onPlaceOrder,
  ctaLabel,
  slotFee = 0,
  disabled = false,
  donation = 0,
}: CartSummaryProps) {
  const { items, totals, couponCode } = useCart();
  const total = totals.total + slotFee + donation;

  // `totals` (server-computed) only counts selected lines — match that here
  // so "you save" doesn't include a deselected item's MRP gap.
  const mrpTotal = items
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.mrp * item.qty, 0);
  const savings = Math.max(0, mrpTotal - totals.subtotal);
  // Blended effective rate for display — `gstAmount` is summed across lines
  // that can each carry a different `gstRate`, so there's no single "the"
  // percentage from the server; this is the closest single number to show.
  const gstPct =
    totals.subtotal > 0
      ? Math.round((totals.gstAmount / totals.subtotal) * 100)
      : 0;

  return (
    <aside className="h-fit md:sticky md:top-24">
      <div className="rounded-3xl border border-border/60 bg-white p-6">
        <p className="mb-4 font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
          Bill details
        </p>
        <div className="flex flex-col gap-2.5 text-sm">
          <Row
            label="Item total"
            value={rupee(totals.subtotal)}
            strikeValue={savings > 0 ? rupee(mrpTotal) : undefined}
          />
          {totals.discount > 0 && (
            <Row
              label={`Coupon (${couponCode})`}
              value={`− ${rupee(totals.discount)}`}
              highlight
            />
          )}
          <Row
            label="Delivery fee"
            value={
              totals.deliveryFee === 0 ? "FREE" : rupee(totals.deliveryFee)
            }
            highlight={totals.deliveryFee === 0}
          />
          {slotFee > 0 && (
            <Row label="Scheduled delivery fee" value={rupee(slotFee)} />
          )}
          {donation > 0 && (
            <Row label="Social donation" value={rupee(donation)} />
          )}
          <Row label={`GST (${gstPct}%)`} value={rupee(totals.gstAmount)} />
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
        {savings + totals.discount > 0 && (
          <div className="mt-4 rounded-xl bg-accent/30 px-4 py-2.5 text-center font-semibold text-primary text-xs">
            You save {rupee(savings + totals.discount)} on this order 🎉
          </div>
        )}
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={disabled}
          data-testid="web-place-order"
          className="mt-6 w-full cursor-pointer rounded-full bg-primary py-4 font-semibold text-primary-foreground text-sm transition-all hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {ctaLabel ?? "Select Address →"}
        </button>
        <p className="mt-3 text-center text-[11px] text-foreground/50">
          By placing your order, you agree to our terms of service and refund
          policy.
        </p>
      </div>

      {totals.subtotal < totals.freeDeliveryThreshold && (
        <div className="mt-4 rounded-2xl border border-border/50 bg-secondary/50 p-4 text-foreground/70 text-xs">
          <p className="mb-1 font-semibold text-foreground">
            Free delivery over {rupee(totals.freeDeliveryThreshold)}
          </p>
          <p>
            Add {rupee(totals.freeDeliveryThreshold - totals.subtotal)} more to
            unlock free delivery.
          </p>
        </div>
      )}
    </aside>
  );
}
