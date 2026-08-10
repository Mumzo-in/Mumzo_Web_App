import { Checkbox } from "@mumzo/ui/components/checkbox";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, MapPin, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddresses } from "@/modules/account";
import { useRequireAuth } from "@/modules/auth";
import {
  CartBlockingOverlay,
  CartLineItem,
  CartSummary,
  CouponBox,
  rupee,
  useCart,
} from "@/modules/cart";
import {
  type Product,
  ProductVariantDialog,
  productsQueryOptions,
  toProduct,
} from "@/modules/catalog";
import { CheckoutSteps, useCheckout } from "@/modules/checkout";
import {
  NotServiceable,
  useModalStore,
  useServiceability,
} from "@/modules/location";
import { useWishlist } from "@/modules/wishlist";

export const Route = createFileRoute("/(store)/cart")({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    totals,
    // clear,
    isLoading,
    toggleSelectAll,
    isMutating,
    addItemBlocking,
    // moveToWishlist,
  } = useCart();
  const { serviceable, pincode: activePincode } = useServiceability();
  const { openModal } = useModalStore();
  const { run } = useRequireAuth();
  const { defaultAddress } = useAddresses();
  const { setAddressId } = useCheckout();
  // A default address that doesn't match the pincode currently being
  // delivered to — the address on file is "far" from where checkout would
  // actually ship. Surfaced as a prompt, not shown by default.
  const addressMismatch = Boolean(
    defaultAddress && defaultAddress.pincode !== activePincode,
  );
  const needsAddressAttention =
    !serviceable || !defaultAddress || addressMismatch;
  const { ids: wishlistIds } = useWishlist();
  const [selectingVariantProduct, setSelectingVariantProduct] =
    useState<Product | null>(null);

  // Resolve wishlisted product IDs into full Product objects for the
  // "From your wishlist" strip at the bottom of the cart items column.
  const { data: allProductsPage } = useQuery({
    ...productsQueryOptions({ limit: 100 }),
    enabled: wishlistIds.length > 0,
  });
  const wishedProducts = (allProductsPage?.data ?? [])
    .map(toProduct)
    .filter((p) => wishlistIds.includes(p.id));

  // const [donationChecked, setDonationChecked] = useState(false);
  // const [donationAmount, setDonationAmount] = useState(10);
  // const donation = donationChecked ? donationAmount : 0;

  const selectedCount = items.filter((item) => item.selected).length;
  const allSelected = items.length > 0 && selectedCount === items.length;
  // Only a selected line blocks checkout — a deselected out-of-stock item
  // isn't part of this order.
  const hasOutOfStock = items.some(
    (item) => item.selected && item.isOutOfStock,
  );

  const goToCheckout = () => {
    if (defaultAddress) {
      setAddressId(defaultAddress.id);
      if (!needsAddressAttention) {
        navigate({ to: "/checkout/payment" });
        return;
      }
    }
    navigate({ to: "/checkout/address" });
  };

  const placeOrder = () => {
    if (items.length === 0) return;
    if (isMutating) return;
    if (selectedCount === 0) {
      toast.error("Select at least one item to check out");
      return;
    }
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

  return (
    <div
      data-testid="web-cart-page"
      className="mx-auto w-full max-w-7xl px-3 pt-3 pb-24 sm:px-6 sm:pt-6 lg:pb-16"
    >
      <CartBlockingOverlay active={isMutating} />
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
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-4 sm:gap-5 md:col-span-7 xl:col-span-8">
            {!serviceable ? (
              <NotServiceable compact />
            ) : (
              !defaultAddress && (
                <div
                  data-testid="web-cart-no-address"
                  className="flex items-center justify-between gap-3 rounded-3xl border border-primary/30 bg-accent/20 p-4 shadow-warm sm:p-5"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink text-sm">
                        Add a delivery address
                      </p>
                      <p className="mt-0.5 text-foreground/60 text-xs">
                        You'll need one to check out.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      run(
                        () => navigate({ to: "/checkout/address" }),
                        "Sign in to add a delivery address.",
                      )
                    }
                    data-testid="web-cart-add-address"
                    className="shrink-0 cursor-pointer rounded-full border border-primary px-3 py-1.5 font-semibold text-[11px] text-primary uppercase tracking-wider transition-colors hover:bg-primary/5 sm:px-4 sm:py-2 sm:text-xs"
                  >
                    Add address
                  </button>
                </div>
              )
            )}

            {serviceable && defaultAddress && addressMismatch && (
              <div
                data-testid="web-cart-address-mismatch"
                className="flex items-center justify-between gap-3 rounded-3xl border border-primary/30 bg-accent/20 p-4 shadow-warm sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink text-sm">
                      Your saved address is in a different area
                    </p>
                    <p className="mt-0.5 text-foreground/60 text-xs">
                      We're currently delivering to {activePincode}. Update your
                      location or address before checking out.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openModal("location")}
                  data-testid="web-cart-fix-address"
                  className="shrink-0 cursor-pointer rounded-full border border-primary px-3 py-1.5 font-semibold text-[11px] text-primary uppercase tracking-wider transition-colors hover:bg-primary/5 sm:px-4 sm:py-2 sm:text-xs"
                >
                  Change location
                </button>
              </div>
            )}

            {items.length === 0 ? (
              /* Inline Empty Cart Card */
              <div className="flex flex-col items-center justify-center rounded-3xl border border-border/60 bg-white p-8 text-center shadow-warm sm:p-12">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-primary/10 bg-accent/20">
                  <ShoppingBag size={24} className="text-primary" />
                </div>
                <p className="font-editorial text-ink text-xl sm:text-2xl">
                  Your cart is empty
                </p>
                <p className="mt-1.5 text-foreground/60 text-xs sm:text-sm">
                  There are no items in your cart. Add items from your wishlist
                  or explore our collection.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {wishedProducts.length > 0 && (
                    <Link
                      to="/wishlist"
                      className="inline-block rounded-full border border-primary px-5 py-2.5 font-semibold text-primary text-xs transition-colors hover:bg-primary/5"
                    >
                      Add items from wishlist
                    </Link>
                  )}
                  <Link
                    to="/"
                    className="inline-block rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-xs transition-colors hover:bg-primary/95"
                  >
                    Shop products
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Selected Items Header & Actions */}
                <div className="mt-1 flex items-center justify-between border-border/50 border-b px-1 pb-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      disabled={isMutating}
                      aria-label="Select all items"
                      data-testid="web-cart-select-all"
                    />
                    <span className="font-bold text-ink text-xs tracking-wider sm:text-sm">
                      {selectedCount}/{items.length} ITEMS SELECTED
                    </span>
                  </div>
                  {/* <div className="flex gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={clear}
                      className="cursor-pointer font-bold text-[11px] text-foreground/50 hover:text-ink hover:underline sm:text-xs"
                    >
                      REMOVE
                    </button>
                    <button
                      type="button"
                      disabled={selectedCount === 0}
                      onClick={() => {
                        run(async () => {
                          const selected = items.filter((i) => i.selected);
                          if (selected.length === 0) return;
                          await moveToWishlist(selected.map((i) => i.id));
                          toast.success(
                            `Moved ${selected.length} ${selected.length === 1 ? "item" : "items"} to wishlist`,
                          );
                          await navigate({ to: "/wishlist" });
                        }, "Sign in to move items to your wishlist.");
                      }}
                      className="cursor-pointer font-bold text-[11px] text-foreground/50 hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-40 sm:text-xs"
                    >
                      MOVE TO WISHLIST
                    </button>
                  </div> */}
                </div>

                {/* Cart Items List */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  {items.map((item) => (
                    <CartLineItem key={item.id} item={item} />
                  ))}
                </div>
              </>
            )}

            {/* Add More From Wishlist */}
            {wishedProducts.length > 0 && (
              <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-white p-4 shadow-warm sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart size={16} className="text-primary" />
                    <span className="font-semibold text-ink text-sm">
                      From your wishlist
                    </span>
                  </div>
                  <Link
                    to="/wishlist"
                    className="font-bold text-[11px] text-primary uppercase tracking-wider hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                  {wishedProducts.map((product) => {
                    const pInCart = items.find(
                      (i) => i.productId === product.id,
                    );
                    const hasVariants =
                      product.sizes.length + product.colors.length > 1;
                    return (
                      <div
                        key={product.id}
                        className="flex w-28 shrink-0 flex-col gap-2 sm:w-32"
                      >
                        <Link
                          to="/product/$productId"
                          params={{ productId: product.id }}
                          className="relative overflow-hidden rounded-xl"
                        >
                          <img
                            src={product.images[0] ?? ""}
                            alt={product.name}
                            className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </Link>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="truncate font-semibold text-[11px] text-ink">
                            {product.name}
                          </p>
                          <p className="font-bold text-ink text-xs">
                            {rupee(product.price)}
                          </p>
                        </div>
                        {pInCart ? (
                          <span className="rounded-lg bg-accent/40 px-2 py-1.5 text-center font-semibold text-[10px] text-ink">
                            In cart
                          </span>
                        ) : hasVariants ? (
                          <button
                            type="button"
                            onClick={() => setSelectingVariantProduct(product)}
                            className="cursor-pointer rounded-lg border border-primary/40 px-2 py-1.5 font-semibold text-[10px] text-primary transition-colors hover:bg-primary/5"
                          >
                            Choose options
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addItemBlocking(product)}
                            className="cursor-pointer rounded-lg border border-primary/40 px-2 py-1.5 font-semibold text-[10px] text-primary transition-colors hover:bg-primary/5"
                          >
                            Add to cart
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <ProductVariantDialog
              product={selectingVariantProduct}
              onClose={() => setSelectingVariantProduct(null)}
              onConfirm={(p, variantLabel) => addItemBlocking(p, variantLabel)}
            />
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
              ctaLabel={
                defaultAddress && !needsAddressAttention
                  ? "Proceed to pay →"
                  : "Select Address →"
              }
              // donation={donation}
              disabled={
                hasOutOfStock ||
                !serviceable ||
                selectedCount === 0 ||
                isMutating
              }
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
            disabled={
              hasOutOfStock || !serviceable || selectedCount === 0 || isMutating
            }
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground text-sm shadow-md transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {defaultAddress && !needsAddressAttention
              ? "Proceed to pay →"
              : "Select Address →"}
          </button>
        </div>
      )}
    </div>
  );
}
