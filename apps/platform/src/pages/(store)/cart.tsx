import { Checkbox } from "@mumzo/ui/components/checkbox";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, MapPin, Percent, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddresses } from "@/modules/account";
import { useRequireAuth } from "@/modules/auth";
import { CartLineItem, CartSummary, CouponBox, useCart } from "@/modules/cart";
import { CheckoutSteps, useCheckout } from "@/modules/checkout";
import { NotServiceable, useServiceability } from "@/modules/location";

export const Route = createFileRoute("/(store)/cart")({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { items, clear, isLoading } = useCart();
  const { serviceable } = useServiceability();
  const { run } = useRequireAuth();
  const { addresses, defaultAddress } = useAddresses();
  const { setAddressId } = useCheckout();

  const [donationChecked, setDonationChecked] = useState(false);
  const [donationAmount, setDonationAmount] = useState(10);
  const donation = donationChecked ? donationAmount : 0;

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const hasOutOfStock = items.some((item) => item.isOutOfStock);

  const goToCheckout = () => {
    if (defaultAddress) {
      setAddressId(defaultAddress.id);
      navigate({ to: "/checkout/payment" });
    } else {
      navigate({ to: "/checkout/address" });
    }
  };

  const placeOrder = () => {
    if (items.length === 0) return;
    if (!serviceable) {
      toast.error("We don't deliver to your location yet");
      return;
    }
    if (hasOutOfStock) {
      toast.error("Remove out-of-stock items to continue");
      return;
    }
    run(goToCheckout, "Sign in to complete your order.");
  };

  const selectedAddress = defaultAddress || addresses[0] || null;

  return (
    <div
      data-testid="web-cart-page"
      className="mx-auto w-full max-w-7xl px-4 pt-4 pb-16"
    >
      <div className="mb-4">
        <CheckoutSteps current="bag" />
      </div>

      {isLoading ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-4 divide-y divide-border/60 rounded-3xl border border-border/60 bg-white p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                key={`cart-skeleton-${i}`}
                className="flex gap-4 py-4 first:pt-0"
              >
                <Skeleton className="size-20 shrink-0 rounded-xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="mt-auto h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-white py-20 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-primary/10 bg-accent/20">
            <ShoppingBag size={28} className="text-primary" />
          </div>
          <p className="font-editorial text-3xl text-ink">Your cart is empty</p>
          <p className="mt-2 text-foreground/60 text-sm">
            Head back and fill it with love.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block cursor-pointer rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-5">
            {!serviceable && <NotServiceable compact />}

            {/* Address Pincode / Deliver To Card */}
            <div className="flex items-center justify-between rounded-3xl border border-border/60 bg-white p-5 shadow-warm sm:p-6">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-1 shrink-0 text-primary" />
                <div>
                  {selectedAddress ? (
                    <>
                      <p className="text-foreground/50 text-xs">Deliver to:</p>
                      <p className="mt-0.5 font-semibold text-ink text-sm">
                        {selectedAddress.name} · {selectedAddress.pincode}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-foreground/60 text-xs">
                        {selectedAddress.line1}, {selectedAddress.line2},{" "}
                        {selectedAddress.city}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-ink text-sm">
                        Check delivery time & services
                      </p>
                      <p className="mt-0.5 text-foreground/60 text-xs">
                        Enter pincode to check serviceability
                      </p>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/checkout/address" })}
                className="cursor-pointer rounded-full border border-primary px-4 py-2 font-semibold text-primary text-xs uppercase tracking-wider transition-colors hover:bg-primary/5"
              >
                {selectedAddress ? "Change" : "Enter Pin Code"}
              </button>
            </div>

            {/* Bank Offers Carousel Card */}
            <div className="rounded-3xl border border-border/60 bg-white p-5 shadow-warm sm:p-6">
              <div className="mb-4 flex items-center gap-2 font-semibold text-foreground/75 text-xs uppercase tracking-wider">
                <Percent size={15} className="text-primary" />
                <span>Available Offers</span>
              </div>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
                <div className="flex min-w-[260px] max-w-[260px] flex-col justify-between rounded-2xl border border-border/60 bg-secondary/35 p-4">
                  <div>
                    <span className="inline-block rounded-full bg-accent/40 px-2 py-0.5 font-bold text-[9px] text-primary uppercase">
                      Bank Offer
                    </span>
                    <p className="mt-2 font-semibold text-ink text-xs leading-relaxed">
                      10% Instant Discount on SBI Credit Card on min spend of
                      ₹3,500
                    </p>
                  </div>
                </div>
                <div className="flex min-w-[260px] max-w-[260px] flex-col justify-between rounded-2xl border border-border/60 bg-secondary/35 p-4">
                  <div>
                    <span className="inline-block rounded-full bg-accent/40 px-2 py-0.5 font-bold text-[9px] text-primary uppercase">
                      Promo Code
                    </span>
                    <p className="mt-2 font-semibold text-ink text-xs leading-relaxed">
                      Flat ₹50 OFF on first purchase with coupon MUMZO50
                    </p>
                  </div>
                </div>
                <div className="flex min-w-[260px] max-w-[260px] flex-col justify-between rounded-2xl border border-border/60 bg-secondary/35 p-4">
                  <div>
                    <span className="inline-block rounded-full bg-accent/40 px-2 py-0.5 font-bold text-[9px] text-primary uppercase">
                      Shipping
                    </span>
                    <p className="mt-2 font-semibold text-ink text-xs leading-relaxed">
                      Free Delivery automatically applied on orders above ₹499
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Items Header & Actions */}
            <div className="mt-2 flex items-center justify-between border-border/50 border-b px-1 pb-3">
              <div className="flex items-center gap-2.5">
                <Checkbox checked={true} disabled aria-label="Selected count" />
                <span className="font-bold text-ink text-sm tracking-wider">
                  {itemCount}/{itemCount} ITEMS SELECTED
                </span>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={clear}
                  className="cursor-pointer font-bold text-foreground/50 text-xs hover:text-ink hover:underline"
                >
                  REMOVE
                </button>
                <Link
                  to="/profile"
                  className="cursor-pointer font-bold text-foreground/50 text-xs hover:text-ink hover:underline"
                >
                  MOVE TO WISHLIST
                </Link>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <CartLineItem key={item.id} item={item} />
              ))}
            </div>

            {/* Add More From Wishlist Card */}
            <Link
              to="/profile"
              className="flex items-center justify-between rounded-3xl border border-border/60 bg-white p-5 shadow-warm transition-colors hover:bg-secondary/10"
            >
              <div className="flex items-center gap-3">
                <Heart size={18} className="text-primary" />
                <span className="font-semibold text-ink text-sm">
                  Add More From Wishlist
                </span>
              </div>
              <span className="text-foreground/45">&rarr;</span>
            </Link>
          </div>

          {/* Right Column (Coupons, Donation, Price Details) */}
          <div className="flex flex-col gap-6">
            <CouponBox />

            {/* Donation Card */}
            <div className="rounded-3xl border border-border/60 bg-white p-5 shadow-warm sm:p-6">
              <p className="mb-3 font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
                SUPPORT TRANSFORMATIVE SOCIAL WORK
              </p>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="donate-check"
                  checked={donationChecked}
                  onCheckedChange={(checked) =>
                    setDonationChecked(checked === true)
                  }
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="donate-check"
                    className="cursor-pointer select-none font-semibold text-ink text-sm"
                  >
                    Donate and make a difference
                  </label>
                  <p className="mt-0.5 text-foreground/55 text-xs leading-normal">
                    Support mothers &amp; babies in Hyderabad standard care.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[10, 20, 50, 100].map((amount) => {
                  const active = donationAmount === amount;
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setDonationAmount(amount);
                        setDonationChecked(true);
                      }}
                      className={`cursor-pointer rounded-full border px-4 py-2 font-semibold text-xs transition-colors ${
                        active && donationChecked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground/75 hover:border-primary/40"
                      }`}
                    >
                      ₹{amount}
                    </button>
                  );
                })}
              </div>
            </div>

            <CartSummary
              onPlaceOrder={placeOrder}
              donation={donation}
              disabled={hasOutOfStock || !serviceable}
            />
          </div>
        </div>
      )}
    </div>
  );
}
