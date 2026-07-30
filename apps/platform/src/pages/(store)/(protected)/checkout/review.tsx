import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, MapPin, Pencil, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/core/api/client";
import { useAddresses } from "@/modules/account";
import { CartSummary, rupee, useCart } from "@/modules/cart";
import {
  CheckoutSteps,
  clearCheckoutDraft,
  findWindow,
  paymentMethods,
  useCheckout,
} from "@/modules/checkout";
import { placeOrder as placeOrderApi } from "@/modules/orders";

export const Route = createFileRoute("/(store)/(protected)/checkout/review")({
  component: CheckoutReviewPage,
});

function CheckoutReviewPage() {
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const { addresses } = useAddresses();
  const { addressId, slotLabel, mode, slotWindowId, paymentMethod } =
    useCheckout();
  const SlotIcon = mode === "express" ? Zap : CalendarClock;
  const slotFee =
    mode === "scheduled" ? (findWindow(slotWindowId ?? "")?.fee ?? 0) : 0;
  const [placing, setPlacing] = useState(false);

  const address = addresses.find((a) => a.id === addressId) ?? null;
  const payment = paymentMethods.find((p) => p.id === paymentMethod) ?? null;

  const placeOrder = async () => {
    if (placing) return; // PRG-style guard — disabled after first click.
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!address || !payment) {
      toast.error("Please complete address and payment first");
      return;
    }
    if (payment.id !== "cod") {
      toast.error(
        "Online payment is coming soon — pay with Cash on delivery for now.",
      );
      return;
    }

    setPlacing(true);
    try {
      const order = await placeOrderApi({
        addressId: address.id,
        // One key per checkout attempt — a double-click or retried request
        // reuses it and the server returns the same order instead of a
        // duplicate (docs/order-checkout-flow.md §10).
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
    <div className="flex flex-col gap-8">
      <CheckoutSteps current="review" />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          <RecapCard
            title="Delivery address"
            onEdit={() => navigate({ to: "/checkout/address" })}
          >
            {address && (
              <p className="flex items-start gap-2 text-foreground/70 text-sm leading-relaxed">
                <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  <span className="font-semibold text-ink">
                    {address.label} · {address.name}
                  </span>
                  <br />
                  {address.line1}, {address.line2}, {address.city} —{" "}
                  {address.pincode}
                  <br />
                  Phone: {address.phone}
                </span>
              </p>
            )}
            <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-accent/40 px-3 py-1.5 font-semibold text-ink text-xs">
              <SlotIcon size={12} className="text-primary" />
              {slotLabel}
            </p>
          </RecapCard>

          <RecapCard
            title="Payment method"
            onEdit={() => navigate({ to: "/checkout/payment" })}
          >
            {payment && (
              <p className="text-foreground/70 text-sm">
                <span className="font-semibold text-ink">{payment.label}</span>
                {" — "}
                {payment.detail}
              </p>
            )}
          </RecapCard>

          <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-6">
            <h2 className="font-editorial text-ink text-xl">
              Items ({items.length})
            </h2>
            <div className="flex flex-col divide-y divide-border/60">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <img
                    src={item.img ?? ""}
                    alt={item.name}
                    className="size-14 shrink-0 rounded-xl border border-border/60 object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-ink text-sm">
                      {item.name}
                    </p>
                    <p className="text-foreground/60 text-xs">
                      {item.brand}
                      {item.variantLabel ? ` · ${item.variantLabel}` : ""} · Qty{" "}
                      {item.qty}
                    </p>
                  </div>
                  <p className="font-semibold text-ink text-sm">
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

function RecapCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-editorial text-ink text-xl">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-primary text-xs hover:underline"
        >
          <Pencil size={12} />
          Change
        </button>
      </div>
      {children}
    </section>
  );
}
