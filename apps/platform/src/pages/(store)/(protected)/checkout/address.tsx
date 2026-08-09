import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AddressCard, AddressForm, useAddresses } from "@/modules/account";
import { CartSummary, useCart } from "@/modules/cart";
import {
  CheckoutSteps,
  findWindow,
  SlotSelector,
  useCheckout,
} from "@/modules/checkout";
import { NotServiceable, useServiceability } from "@/modules/location";

export const Route = createFileRoute("/(store)/(protected)/checkout/address")({
  component: CheckoutAddressPage,
});

function CheckoutAddressPage() {
  const navigate = useNavigate();
  const { items, totals } = useCart();
  const { addresses, defaultAddress, addAddress } = useAddresses();
  const { addressId, setAddressId, slotReady, mode, slotWindowId } =
    useCheckout();
  const { serviceable, expressAvailable, pincode, query, lat, lng } =
    useServiceability();
  const slotFee =
    mode === "scheduled" ? (findWindow(slotWindowId ?? "")?.fee ?? 0) : 0;
  const [adding, setAdding] = useState(false);

  const total = totals.total + slotFee;

  useEffect(() => {
    if (!addressId && defaultAddress) setAddressId(defaultAddress.id);
  }, [addressId, defaultAddress, setAddressId]);

  const continueToPayment = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!addressId) {
      toast.error("Please select a delivery address");
      return;
    }
    if (!slotReady) {
      toast.error("Please pick a delivery day and time");
      return;
    }
    navigate({ to: "/checkout/payment" });
  };

  // Hard gate — nothing can be ordered outside our delivery zone.
  if (!serviceable) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <CheckoutSteps current="address" />
        <NotServiceable />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <CheckoutSteps current="address" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-4 sm:gap-6 md:col-span-7 xl:col-span-8">
          <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-4 shadow-warm sm:p-6">
            <h2 className="font-editorial text-ink text-lg sm:text-xl">
              Delivery address
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  selectable
                  selected={address.id === addressId}
                  onSelect={() => setAddressId(address.id)}
                />
              ))}
            </div>

            {adding ? (
              <div className="rounded-3xl border border-border/60 bg-secondary/40 p-4 sm:p-5">
                <AddressForm
                  existing={addresses}
                  initial={{
                    id: "",
                    label: "Home",
                    name: "",
                    phone: "",
                    line1: "",
                    line2: query,
                    landmark: "",
                    pincode,
                    city: "Hyderabad",
                    lat,
                    lng,
                    isDefault: false,
                  }}
                  onSubmit={async (draft) => {
                    const created = await addAddress(draft);
                    setAddressId(created.id);
                    setAdding(false);
                    toast.success("Address added");
                  }}
                  onCancel={() => setAdding(false)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                data-testid="web-add-address"
                className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full border border-primary/30 px-4 py-2 font-semibold text-primary text-xs transition-colors hover:bg-primary/5 sm:text-sm"
              >
                <Plus size={15} />
                Add new address
              </button>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-4 shadow-warm sm:p-6">
            <h2 className="font-editorial text-ink text-lg sm:text-xl">
              Delivery slot
            </h2>
            {!expressAvailable && (
              <p className="rounded-xl bg-accent/30 px-3.5 py-2.5 text-foreground/70 text-xs leading-relaxed">
                10-minute express isn't available at your location yet — please
                pick a scheduled slot.
              </p>
            )}
            <SlotSelector expressAvailable={expressAvailable} />
          </section>
        </div>

        <div className="flex flex-col gap-5 sm:gap-6 md:col-span-5 xl:col-span-4">
          <CartSummary
            onPlaceOrder={continueToPayment}
            ctaLabel="Continue to payment →"
            slotFee={slotFee}
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
            ₹{total}
          </span>
        </div>
        <button
          type="button"
          onClick={continueToPayment}
          className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground text-sm shadow-md transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          Payment &rarr;
        </button>
      </div>
    </div>
  );
}
