import { Skeleton } from "@mumzo/ui/components/skeleton";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { useRequireAuth } from "@/modules/auth";
import { CartLineItem, CartSummary, CouponBox, useCart } from "@/modules/cart";
import { NotServiceable, useServiceability } from "@/modules/location";

export const Route = createFileRoute("/(store)/cart")({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { items, clear, isLoading } = useCart();
  const { serviceable } = useServiceability();
  const { run } = useRequireAuth();
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const hasOutOfStock = items.some((item) => item.isOutOfStock);

  const goToCheckout = () => {
    navigate({
      to: "/checkout/address",
      params: { orderId: "", productId: "" },
    });
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

  return (
    <div
      data-testid="web-cart-page"
      className="mx-auto w-full max-w-7xl pt-8 pb-16"
    >
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Your cart" }]}
      />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl lg:text-5xl">
            Your cart
          </h1>
          <p className="mt-2 text-foreground/60 text-sm">
            {isLoading
              ? "Loading…"
              : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          </p>
        </div>
        {!isLoading && items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            data-testid="web-clear"
            className="cursor-pointer font-semibold text-primary text-sm hover:underline"
          >
            Clear cart
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-4 divide-y divide-border/60 rounded-3xl border border-border/60 bg-white p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`cart-skeleton-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count, never reordered
                  i
                }`}
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
          <div className="flex flex-col gap-4">
            {!serviceable && <NotServiceable compact />}

            <div className="divide-y divide-border/60 rounded-3xl border border-border/60 bg-white">
              {items.map((item) => (
                <CartLineItem key={item.id} item={item} />
              ))}
            </div>

            <CouponBox />
          </div>
          <CartSummary
            onPlaceOrder={placeOrder}
            disabled={hasOutOfStock || !serviceable}
          />
        </div>
      )}
    </div>
  );
}
