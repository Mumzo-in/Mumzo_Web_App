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
  const { items, clear } = useCart();
  const { addresses } = useAddresses();
  const { addressId, slotLabel, mode, slotWindowId, paymentMethod } =
    useCheckout();
  const [placing, setPlacing] = useState(false);

  const SlotIcon = mode === "express" ? Zap : CalendarClock;
  const slotFee =
    mode === "scheduled" ? (findWindow(slotWindowId ?? "")?.fee ?? 0) : 0;

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
    <div className="flex flex-col gap-8 px-4 sm:px-0">
      <CheckoutSteps current="payment" />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          {/* Deliver Address Recap Card */}
          <section className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-white p-5 shadow-warm">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial font-medium text-ink text-lg">
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
          <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-5 shadow-warm sm:p-6">
            <h2 className="font-editorial font-medium text-ink text-lg">
              Payment method
            </h2>
            <PaymentMethodSelector />
          </section>

          {/* Items Recap Card */}
          <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-5 shadow-warm sm:p-6">
            <h2 className="font-editorial font-medium text-ink text-lg">
              Order Summary ({items.length}{" "}
              {items.length === 1 ? "item" : "items"})
            </h2>
            <div className="flex flex-col divide-y divide-border/50">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <img
                    src={item.img ?? ""}
                    alt={item.name}
                    className="size-12 shrink-0 rounded-xl border border-border/55 object-cover"
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
                  <p className="font-semibold text-ink text-xs">
                    {rupee(item.price * item.qty)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <CartSummary
          onPlaceOrder={() => void placeOrder()}
          ctaLabel={placing ? "Placing order…" : "Place order"}
          slotFee={slotFee}
          disabled={placing}
        />
      </div>
    </div>
  );
}
