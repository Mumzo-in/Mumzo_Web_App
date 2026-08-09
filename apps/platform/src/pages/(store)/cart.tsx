import { Checkbox } from "@mumzo/ui/components/checkbox";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, MapPin, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAddresses } from "@/modules/account";
import { useRequireAuth } from "@/modules/auth";
import {
  CartLineItem,
  CartSummary,
  CouponBox,
  rupee,
  useCart,
} from "@/modules/cart";
import { CheckoutSteps, useCheckout } from "@/modules/checkout";
import {
  NotServiceable,
  useModalStore,
  useServiceability,
} from "@/modules/location";

export const Route = createFileRoute("/(store)/cart")({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { items, totals, clear, isLoading } = useCart();
  const { serviceable, query, pincode } = useServiceability();
  const { openModal } = useModalStore();
  const { run } = useRequireAuth();
  const { addresses, defaultAddress } = useAddresses();
  const { setAddressId } = useCheckout();

  // const [donationChecked, setDonationChecked] = useState(false);
  // const [donationAmount, setDonationAmount] = useState(10);
  // const donation = donationChecked ? donationAmount : 0;

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
      className="mx-auto w-full max-w-7xl px-3 pt-3 pb-24 sm:px-6 sm:pt-6 lg:pb-16"
    >
      <div className="mb-4">
        <CheckoutSteps current="bag" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-4 divide-y divide-border/60 rounded-3xl border border-border/60 bg-white p-4 md:col-span-7 xl:col-span-8">
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
          <Skeleton className="h-64 rounded-3xl md:col-span-5 xl:col-span-4" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-white py-16 text-center sm:py-20">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-primary/10 bg-accent/20">
            <ShoppingBag size={28} className="text-primary" />
          </div>
          <p className="font-editorial text-2xl text-ink sm:text-3xl">
            Your cart is empty
          </p>
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-4 sm:gap-5 md:col-span-7 xl:col-span-8">
            {!serviceable && <NotServiceable compact />}

            {/* Address Pincode / Deliver To Card Trigger */}
            <button
              type="button"
              onClick={() => openModal("location")}
              data-testid="web-cart-location-trigger"
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-3xl border border-border/60 bg-white p-4 text-left shadow-warm transition-colors hover:border-primary/40 sm:p-6"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">
                <MapPin size={18} className="mt-1 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  {selectedAddress ? (
                    <>
                      <p className="text-foreground/50 text-xs">Deliver to:</p>
                      <p className="mt-0.5 truncate font-semibold text-ink text-sm">
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
                        Delivering to {query} ({pincode})
                      </p>
                      <p className="mt-0.5 text-foreground/60 text-xs">
                        Click to enter pincode or change location
                      </p>
                    </>
                  )}
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-primary px-3 py-1.5 font-semibold text-[11px] text-primary uppercase tracking-wider transition-colors hover:bg-primary/5 sm:px-4 sm:py-2 sm:text-xs">
                {selectedAddress ? "Change" : "Enter Pin Code"}
              </span>
            </button>

            {/* Bank Offers Carousel Card */}
            {/* <div className="rounded-3xl border border-border/60 bg-white p-4 shadow-warm sm:p-6">
              <div className="mb-3 flex items-center gap-2 font-semibold text-foreground/75 text-xs uppercase tracking-wider sm:mb-4">
                <Percent size={15} className="text-primary" />
                <span>Available Offers</span>
              </div>
              <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1 sm:gap-4">
                <div className="flex min-w-[210px] max-w-[240px] flex-1 flex-col justify-between rounded-2xl border border-border/60 bg-secondary/35 p-3.5 sm:p-4">
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
                <div className="flex min-w-[210px] max-w-[240px] flex-1 flex-col justify-between rounded-2xl border border-border/60 bg-secondary/35 p-3.5 sm:p-4">
                  <div>
                    <span className="inline-block rounded-full bg-accent/40 px-2 py-0.5 font-bold text-[9px] text-primary uppercase">
                      Promo Code
                    </span>
                    <p className="mt-2 font-semibold text-ink text-xs leading-relaxed">
                      Flat ₹50 OFF on first purchase with coupon MUMZO50
                    </p>
                  </div>
                </div>
                <div className="flex min-w-[210px] max-w-[240px] flex-1 flex-col justify-between rounded-2xl border border-border/60 bg-secondary/35 p-3.5 sm:p-4">
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
            </div> */}

            {/* Selected Items Header & Actions */}
            <div className="mt-1 flex items-center justify-between border-border/50 border-b px-1 pb-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={true} disabled aria-label="Selected count" />
                <span className="font-bold text-ink text-xs tracking-wider sm:text-sm">
                  {itemCount}/{itemCount} ITEMS SELECTED
                </span>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={clear}
                  className="cursor-pointer font-bold text-[11px] text-foreground/50 hover:text-ink hover:underline sm:text-xs"
                >
                  REMOVE
                </button>
                <Link
                  to="/profile"
                  className="cursor-pointer font-bold text-[11px] text-foreground/50 hover:text-ink hover:underline sm:text-xs"
                >
                  MOVE TO WISHLIST
                </Link>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {items.map((item) => (
                <CartLineItem key={item.id} item={item} />
              ))}
            </div>

            {/* Add More From Wishlist Card */}
            <Link
              to="/profile"
              className="flex items-center justify-between rounded-3xl border border-border/60 bg-white p-4 shadow-warm transition-colors hover:bg-secondary/10 sm:p-5"
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
          <div className="flex flex-col gap-5 sm:gap-6 md:col-span-5 xl:col-span-4">
            <CouponBox />

            {/* Donation Card */}
            {/* <div className="rounded-3xl border border-border/60 bg-white p-4 shadow-warm sm:p-6">
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
            </div> */}

            <CartSummary
              onPlaceOrder={placeOrder}
              // donation={donation}
              disabled={hasOutOfStock || !serviceable}
            />
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom CTA Bar */}
      {items.length > 0 && !isLoading && (
        <div className="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-between gap-3 border-border/80 border-t bg-white/95 p-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden">
          <div className="flex flex-col">
            <span className="font-semibold text-[10px] text-foreground/50 uppercase tracking-wider">
              To Pay
            </span>
            <span className="font-bold font-editorial text-ink text-xl">
              {/* {rupee(totals.total + donation)} */}
              {rupee(totals.total)}
            </span>
          </div>
          <button
            type="button"
            onClick={placeOrder}
            disabled={hasOutOfStock || !serviceable}
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground text-sm shadow-md transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Checkout &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
