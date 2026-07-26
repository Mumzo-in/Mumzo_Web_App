import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { type CartItem, rupee, useCart } from "../../store/cart-provider";

interface CartLineItemProps {
  item: CartItem;
}

export default function CartLineItem({ item }: CartLineItemProps) {
  const { updateQty, removeItem } = useCart();

  return (
    <div
      data-testid={`web-cart-item-${item.id}`}
      className="flex gap-3 p-4 sm:gap-4 sm:p-5"
    >
      <Link
        to="/product/$productId"
        params={{ productId: item.id }}
        className="shrink-0"
      >
        <img
          src={item.img}
          alt={item.name}
          className="size-20 rounded-2xl bg-blush/40 object-cover sm:size-24"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-semibold text-[10px] text-foreground/50 uppercase tracking-wider">
          {item.brand}
        </p>
        <Link
          to="/product/$productId"
          params={{ productId: item.id }}
          className="mt-0.5 line-clamp-2 font-medium text-foreground text-sm leading-snug hover:underline"
        >
          {item.name}
        </Link>
        {item.size && (
          <p className="mt-0.5 text-foreground/60 text-xs">Size: {item.size}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-base sm:text-lg">
              {rupee(item.price * item.qty)}
            </span>
            {item.mrp > item.price && (
              <span className="text-foreground/45 text-xs line-through">
                {rupee(item.mrp * item.qty)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => removeItem(item.key)}
              aria-label="Remove item"
              className="rounded-full p-2 text-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={16} />
            </button>
            <div className="inline-flex items-center overflow-hidden rounded-full border border-rose/40 bg-blush">
              <button
                type="button"
                onClick={() => updateQty(item.key, item.qty - 1)}
                data-testid={`web-qty-minus-${item.id}`}
                aria-label="Decrease quantity"
                className="px-2.5 py-1.5 text-pinkDeep transition-colors hover:bg-rose/20"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <span className="min-w-6 text-center font-semibold text-pinkDeep text-sm tabular-nums">
                {item.qty}
              </span>
              <button
                type="button"
                onClick={() => updateQty(item.key, item.qty + 1)}
                data-testid={`web-qty-plus-${item.id}`}
                aria-label="Increase quantity"
                className="px-2.5 py-1.5 text-pinkDeep transition-colors hover:bg-rose/20"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
