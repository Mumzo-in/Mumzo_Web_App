import type { Product } from "@mumzo/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";

import { useServiceability } from "@/modules/location";
import {
  addCartItem,
  applyCartCoupon,
  clearCartApi,
  type PublicCart,
  removeCartCoupon,
  removeCartItem,
  updateCartItem,
} from "../api/cart-api";
import { cartQueryKey, cartQueryOptions } from "../queries/cart";

export type { CartLine as CartItem, CartTotals } from "../api/cart-api";

/** Matches the free-delivery threshold in `shared/pricing.ts` (server), in
 * whole rupees — the wire boundary already converts, so this is just the
 * display-side mirror for the empty-cart banner before any cart exists. */
export const FREE_DELIVERY_OVER = 499;

/** How long a burst of qty clicks waits before the debounced request for
 * that line actually fires — long enough to coalesce a fast 1→5 click run
 * into one request, short enough to still feel live. */
const QTY_DEBOUNCE_MS = 500;

interface CartContextValue {
  items: PublicCart["items"];
  /** `variantLabel` is resolved to the matching productSize/productColor id
   * by looking it up on `product.sizes`/`product.colors` — mirrors the old
   * mock signature so PDP/ProductCard call sites don't need to change. */
  addItem: (
    product: Product,
    variantLabel?: string | null,
    qty?: number,
  ) => void;
  removeItem: (cartItemId: string) => void;
  /** Updates the qty shown immediately; the network write for a given
   * `cartItemId` is debounced so a fast run of clicks sends one request
   * with the final value, not one request per click. */
  updateQty: (cartItemId: string, qty: number) => void;
  clear: () => void;
  couponCode: string | null;
  applyCoupon: (code: string) => Promise<PublicCart>;
  removeCoupon: () => Promise<PublicCart>;
  totals: PublicCart["totals"];
  isLoading: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_TOTALS: PublicCart["totals"] = {
  subtotal: 0,
  gstAmount: 0,
  deliveryFee: 0,
  discount: 0,
  total: 0,
  freeDeliveryThreshold: FREE_DELIVERY_OVER,
};

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { pincode, lat, lng } = useServiceability();
  const location = { pincode, lat, lng };
  const queryKey = cartQueryKey(location);
  const { data: cart, isLoading } = useQuery(cartQueryOptions(location));

  // Pending debounce timers per cart-item-id, so each line's clicks debounce
  // independently — updating one item's qty never delays another's.
  const qtyTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const setCart = useCallback(
    (next: PublicCart) => {
      queryClient.setQueryData(queryKey, next);
    },
    [queryClient, queryKey],
  );

  /** Applies a local patch to the cached cart immediately (optimistic),
   * returns the previous cart so a failed request can roll back to it. */
  const patchCartOptimistically = useCallback(
    (patch: (current: PublicCart) => PublicCart) => {
      const previous = queryClient.getQueryData<PublicCart>(queryKey);
      if (!previous) return null;
      queryClient.setQueryData(queryKey, patch(previous));
      return previous;
    },
    [queryClient, queryKey],
  );

  const addItem = useCallback(
    (product: Product, variantLabel: string | null = null, qty = 1) => {
      const size = variantLabel
        ? product.sizes.find((s) => s.label === variantLabel)
        : undefined;
      const color =
        !size && variantLabel
          ? product.colors.find((c) => c.label === variantLabel)
          : undefined;

      // Optimistic line: bump qty on a matching existing line, or append a
      // temporary one — either way the user sees it before the round trip.
      const previous = patchCartOptimistically((current) => {
        const matchIndex = current.items.findIndex(
          (i) =>
            i.productId === product.id &&
            (i.productSizeId ?? null) === (size?.id ?? null) &&
            (i.productColorId ?? null) === (color?.id ?? null),
        );
        if (matchIndex >= 0) {
          const items = [...current.items];
          const existing = items[matchIndex];
          if (!existing) return current;
          items[matchIndex] = { ...existing, qty: existing.qty + qty };
          return { ...current, items };
        }
        const variant = size ?? color;
        return {
          ...current,
          items: [
            ...current.items,
            {
              id: `optimistic-${product.id}-${size?.id ?? color?.id ?? "base"}`,
              productId: product.id,
              productSizeId: size?.id ?? null,
              productColorId: color?.id ?? null,
              name: product.name,
              brand: product.brand,
              img: product.images[0] ?? null,
              variantLabel: variant?.label ?? null,
              price: variant?.price ?? product.price,
              mrp: product.mrp,
              qty,
              stock: variant?.stock ?? product.stock,
              isOutOfStock: false,
            },
          ],
        };
      });

      addCartItem({
        productId: product.id,
        productSizeId: size?.id ?? null,
        productColorId: color?.id ?? null,
        qty,
      })
        .then(setCart)
        .catch(() => {
          if (previous) setCart(previous);
        });
    },
    [setCart, patchCartOptimistically],
  );

  const removeItem = useCallback(
    (cartItemId: string) => {
      const previous = patchCartOptimistically((current) => ({
        ...current,
        items: current.items.filter((i) => i.id !== cartItemId),
      }));

      removeCartItem(cartItemId)
        .then(setCart)
        .catch(() => {
          if (previous) setCart(previous);
        });
    },
    [setCart, patchCartOptimistically],
  );

  const updateQty = useCallback(
    (cartItemId: string, qty: number) => {
      if (qty <= 0) {
        const timer = qtyTimers.current.get(cartItemId);
        if (timer) {
          clearTimeout(timer);
          qtyTimers.current.delete(cartItemId);
        }
        removeItem(cartItemId);
        return;
      }

      // Reflect the click immediately regardless of the debounce below.
      patchCartOptimistically((current) => ({
        ...current,
        items: current.items.map((i) =>
          i.id === cartItemId ? { ...i, qty } : i,
        ),
      }));

      const existingTimer = qtyTimers.current.get(cartItemId);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        qtyTimers.current.delete(cartItemId);
        updateCartItem(cartItemId, qty).then(setCart);
      }, QTY_DEBOUNCE_MS);
      qtyTimers.current.set(cartItemId, timer);
    },
    [removeItem, setCart, patchCartOptimistically],
  );

  const clear = useCallback(() => {
    void clearCartApi().then(setCart);
  }, [setCart]);

  const applyCoupon = useCallback(
    async (code: string) => {
      const next = await applyCartCoupon(code);
      setCart(next);
      return next;
    },
    [setCart],
  );

  const removeCoupon = useCallback(async () => {
    const next = await removeCartCoupon();
    setCart(next);
    return next;
  }, [setCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: cart?.items ?? [],
      addItem,
      removeItem,
      updateQty,
      clear,
      couponCode: cart?.couponCode ?? null,
      applyCoupon,
      removeCoupon,
      totals: cart?.totals ?? EMPTY_TOTALS,
      isLoading,
    }),
    [
      cart,
      addItem,
      removeItem,
      updateQty,
      clear,
      applyCoupon,
      removeCoupon,
      isLoading,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [],
      addItem: () => {},
      removeItem: () => {},
      updateQty: () => {},
      clear: () => {},
      couponCode: null,
      applyCoupon: async () => ({}) as never,
      removeCoupon: async () => ({}) as never,
      totals: EMPTY_TOTALS,
      isLoading: false,
    };
  }
  return ctx;
}

export const rupee = (n: number): string =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;
