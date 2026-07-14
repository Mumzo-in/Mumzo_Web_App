import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapPin, Pencil, Zap } from "lucide-react";
import { toast } from "sonner";

import { useAddresses } from "@/modules/account";
import { CartSummary } from "@/modules/cart";
import {
  CheckoutSteps,
  deliverySlots,
  PaymentMethodSelector,
  useCheckout,
} from "@/modules/checkout";

export const Route = createFileRoute("/(store)/(protected)/checkout/payment")({
  component: CheckoutPaymentPage,
});

function CheckoutPaymentPage() {
  const navigate = useNavigate();
  const { addresses } = useAddresses();
  const { addressId, slotId, paymentMethod } = useCheckout();

  const address = addresses.find((a) => a.id === addressId) ?? null;
  const slot = deliverySlots.find((s) => s.id === slotId) ?? null;

  const continueToReview = () => {
    if (!paymentMethod) {
      toast.error("Please choose a payment method");
      return;
    }
    navigate({ to: "/checkout/review" });
  };

  return (
    <div className="flex flex-col gap-8">
      <CheckoutSteps current="payment" />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-ink text-xl">Delivering to</h2>
              <button
                type="button"
                onClick={() => navigate({ to: "/checkout/address" })}
                className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-primary text-xs hover:underline"
              >
                <Pencil size={12} />
                Change
              </button>
            </div>
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
                </span>
              </p>
            )}
            {slot && (
              <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-accent/40 px-3 py-1.5 font-semibold text-ink text-xs">
                <Zap size={12} className="text-primary" />
                {slot.label}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-6">
            <h2 className="font-editorial text-ink text-xl">Payment method</h2>
            <PaymentMethodSelector />
          </section>
        </div>

        <CartSummary
          onPlaceOrder={continueToReview}
          ctaLabel="Review order →"
        />
      </div>
    </div>
  );
}
