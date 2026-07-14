import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AddressCard, AddressForm, useAddresses } from "@/modules/account";
import { CartSummary, useCart } from "@/modules/cart";
import { CheckoutSteps, SlotSelector, useCheckout } from "@/modules/checkout";

export const Route = createFileRoute("/(store)/(protected)/checkout/address")({
  component: CheckoutAddressPage,
});

function CheckoutAddressPage() {
  const navigate = useNavigate();
  const { items } = useCart();
  const { addresses, defaultAddress, addAddress } = useAddresses();
  const { addressId, setAddressId } = useCheckout();
  const [adding, setAdding] = useState(false);

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
    navigate({ to: "/checkout/payment" });
  };

  return (
    <div className="flex flex-col gap-8">
      <CheckoutSteps current="address" />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-6">
            <h2 className="font-editorial text-ink text-xl">
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
              <div className="rounded-3xl border border-border/60 bg-secondary/40 p-5">
                <AddressForm
                  onSubmit={(draft) => {
                    const created = addAddress(draft);
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
                className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full border border-primary/30 px-4 py-2 font-semibold text-primary text-sm transition-colors hover:bg-primary/5"
              >
                <Plus size={15} />
                Add new address
              </button>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-6">
            <h2 className="font-editorial text-ink text-xl">Delivery slot</h2>
            <SlotSelector />
          </section>
        </div>

        <CartSummary
          onPlaceOrder={continueToPayment}
          ctaLabel="Continue to payment →"
        />
      </div>
    </div>
  );
}
