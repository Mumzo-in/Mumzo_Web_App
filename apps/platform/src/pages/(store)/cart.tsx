import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { CartLineItem, CartSummary, CouponBox, useCart } from "@/modules/cart";

export const Route = createFileRoute("/(store)/cart")({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { items, totals, clear } = useCart();

  const placeOrder = () => {
    if (items.length === 0) return;
    navigate({
      to: "/checkout/address",
      params: { orderId: "", productId: "" },
    });
  };

  return (
    <div
      data-testid="web-cart-page"
      className="mx-auto max-w-[1280px] pt-8 pb-16"
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
            {totals.count} {totals.count === 1 ? "item" : "items"}
          </p>
        </div>
        {items.length > 0 && (
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

      {items.length === 0 ? (
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
          <div>
            <div className="divide-y divide-border/60 rounded-3xl border border-border/60 bg-white">
              {items.map((item) => (
                <CartLineItem key={item.key} item={item} />
              ))}
            </div>

            <CouponBox />
          </div>
          <CartSummary onPlaceOrder={placeOrder} />
        </div>
      )}
    </div>
  );
}
