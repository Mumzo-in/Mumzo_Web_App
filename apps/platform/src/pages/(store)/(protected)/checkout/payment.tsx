import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, MapPin, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ApiError } from "@/core/api/client";
import { useAddresses } from "@/modules/account";
import { CartSummary, rupee, useCart } from "@/modules/cart";
import {
  CheckoutSteps,
  clearCheckoutDraft,
  findWindow,
  PaymentMethodSelector,
  useCheckout,
} from "@/modules/checkout";
import { placeOrder as placeOrderApi } from "@/modules/orders";

export const Route = createFileRoute("/(store)/(protected)/checkout/payment")({
  component: CheckoutPaymentPage,
});

function CheckoutPaymentPage() {
  const navigate = useNavigate();
  const { items, totals, clear } = useCart();
  const { addresses } = useAddresses();
  const { addressId, slotLabel, mode, slotWindowId, paymentMethod } =
    useCheckout();
  const [placing, setPlacing] = useState(false);

  const SlotIcon = mode === "express" ? Zap : CalendarClock;
  const slotFee =
    mode === "scheduled" ? (findWindow(slotWindowId ?? "")?.fee ?? 0) : 0;
  const total = totals.total + slotFee;

  const address = addresses.find((a) => a.id === addressId) ?? null;

  const placeOrder = async () => {
    if (placing) return;
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!address) {
      toast.error("Please complete address step first");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please choose a payment method");
      return;
    }
    if (paymentMethod !== "cod") {
      toast.error(
        "Online payment is coming soon — pay with Cash on delivery for now.",
      );
      return;
    }

    setPlacing(true);
    try {
      const order = await placeOrderApi({
        addressId: address.id,
        idempotencyKey: crypto.randomUUID(),
      });
      clear();
      clearCheckoutDraft();
      navigate({
        to: "/payment/status",
        search: { status: "success", orderId: order.id },
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Couldn't place your order.";
      toast.error(message);
      setPlacing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <CheckoutSteps current="payment" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-4 sm:gap-6 md:col-span-7 xl:col-span-8">
          {/* Deliver Address Recap Card */}
          <section className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-white p-4 shadow-warm sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial font-medium text-base text-ink sm:text-lg">
                Delivering to
              </h2>
              <button
                type="button"
                onClick={() => navigate({ to: "/checkout/address" })}
                className="cursor-pointer rounded-full border border-primary px-3 py-1 font-semibold text-[10px] text-primary uppercase tracking-wider transition-colors hover:bg-primary/5"
              >
                Change
              </button>
            </div>
            {address && (
              <div className="flex items-start gap-2.5 text-foreground/75 text-xs sm:text-sm">
                <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <span className="font-bold text-ink">
                    {address.label} · {address.name}
                  </span>
                  <br />
                  <span className="text-foreground/60 leading-normal">
                    {address.line1}, {address.line2}, {address.city} —{" "}
                    {address.pincode}
                  </span>
                  <br />
                  <span className="text-[11px] text-foreground/50">
                    Phone: {address.phone}
                  </span>
                </div>
              </div>
            )}
            <p className="mt-1 inline-flex items-center gap-1.5 self-start rounded-full bg-accent/40 px-2.5 py-1 font-semibold text-[10px] text-ink uppercase tracking-wider">
              <SlotIcon size={12} className="text-primary" />
              {slotLabel}
            </p>
          </section>

          {/* Payment Method Selector Card */}
          <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-4 shadow-warm sm:p-6">
            <h2 className="font-editorial font-medium text-base text-ink sm:text-lg">
              Payment method
            </h2>
            <PaymentMethodSelector />
          </section>

          {/* Items Recap Card */}
          <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-4 shadow-warm sm:p-6">
            <h2 className="font-editorial font-medium text-base text-ink sm:text-lg">
              Order Summary ({items.length}{" "}
              {items.length === 1 ? "item" : "items"})
            </h2>
            <div className="flex flex-col divide-y divide-border/50">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4"
                >
                  <img
                    src={item.img ?? ""}
                    alt={item.name}
                    className="size-10 shrink-0 rounded-xl border border-border/55 object-cover sm:size-12"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink text-xs">
                      {item.name}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-foreground/50">
                      {item.brand}
                      {item.variantLabel ? ` · ${item.variantLabel}` : ""} · Qty{" "}
                      {item.qty}
                    </p>
                  </div>
                  <p className="font-semibold text-ink text-xs sm:text-sm">
                    {rupee(item.price * item.qty)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5 sm:gap-6 md:col-span-5 xl:col-span-4">
          <CartSummary
            onPlaceOrder={() => void placeOrder()}
            ctaLabel={placing ? "Placing order…" : "Place order"}
            slotFee={slotFee}
            disabled={placing}
          />
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-between gap-3 border-border/80 border-t bg-white/95 p-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden">
        <div className="flex flex-col">
          <span className="font-semibold text-[10px] text-foreground/50 uppercase tracking-wider">
            To Pay
          </span>
          <span className="font-bold font-editorial text-ink text-xl">
            {rupee(total)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void placeOrder()}
          disabled={placing}
          className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground text-sm shadow-md transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {placing ? "Placing order…" : "Place order"}
        </button>
      </div>
    </div>
  );
}
