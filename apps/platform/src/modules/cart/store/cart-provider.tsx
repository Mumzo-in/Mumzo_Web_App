import type { Product } from "@mumzo/schema";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  moveCartItemsToWishlist,
  type PublicCart,
  removeCartCoupon,
  removeCartItem,
  setAllCartItemsSelected,
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

/** Shared `mutationKey` for every cart-page action (remove, qty change,
 * select toggle, clear, coupon apply/remove) — lets the cart page derive one
 * "is anything in flight" flag via `useIsMutating` instead of each caller
 * tracking its own pending state. Deliberately excludes `addItem`: that
 * fires from product cards/PDP too, where a full-screen block would be
 * wrong there. */
const CART_MUTATION_KEY = ["cart", "mutate"] as const;

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
  /** Same as `addItem`, but participates in `isMutating` — for surfaces
   * (e.g. the wishlist page) that want the blocking overlay on add, unlike
   * the default quick-add used on product cards/PDP everywhere else. */
  addItemBlocking: (
    product: Product,
    variantLabel?: string | null,
    qty?: number,
  ) => void;
  removeItem: (cartItemId: string) => Promise<PublicCart>;
  /** Wishlists each line's product and removes it from the cart, in one
   * request — used by "Move to wishlist" instead of a per-item loop. */
  moveToWishlist: (itemIds: string[]) => Promise<PublicCart>;
  /** Updates the qty shown immediately; the network write for a given
   * `cartItemId` is debounced so a fast run of clicks sends one request
   * with the final value, not one request per click. */
  updateQty: (cartItemId: string, qty: number) => void;
  /** Toggles a line's "included in checkout" flag — persisted server-side,
   * survives a refresh. */
  toggleSelected: (cartItemId: string, selected: boolean) => void;
  /** Selects/deselects every line in one request. */
  toggleSelectAll: (selected: boolean) => void;
  clear: () => void;
  couponCode: string | null;
  applyCoupon: (code: string) => Promise<PublicCart>;
  removeCoupon: () => Promise<PublicCart>;
  totals: PublicCart["totals"];
  isLoading: boolean;
  /** True while any cart-page action (remove, qty change, select toggle,
   * clear, coupon apply/remove) has a request in flight — drives the cart
   * page's blocking top-loader/overlay. Never true during the qty debounce
   * wait, only once the request actually fires; excludes `addItem`. */
  isMutating: boolean;
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
  const location = useMemo(() => ({ pincode, lat, lng }), [pincode, lat, lng]);
  const queryKey = cartQueryKey(location);
  const { data: cart, isLoading } = useQuery(cartQueryOptions(location));
  const isMutating = useIsMutating({ mutationKey: CART_MUTATION_KEY }) > 0;

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

  const addItemMutation = useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: addCartItem,
  });

  /** Resolves the variant, applies the optimistic patch, and returns the
   * snapshot to roll back to plus the resolved network payload — shared by
   * `addItem` (fire-and-forget, outside `isMutating`) and `addItemBlocking`
   * (routed through `addItemMutation`, inside `isMutating`). */
  const prepareAddItem = useCallback(
    (product: Product, variantLabel: string | null, qty: number) => {
      let size = variantLabel
        ? product.sizes.find(
            (s) => s.label === variantLabel || s.id === variantLabel,
          )
        : undefined;
      let color =
        !size && variantLabel
          ? product.colors.find(
              (c) => c.label === variantLabel || c.id === variantLabel,
            )
          : undefined;

      // If variant wasn't specified or matched, default to the first in-stock
      // variant (or first size/color) so productSizeId/productColorId isn't null,
      // which inventory checks evaluate as 0 stock.
      if (!size && !color) {
        size = product.sizes.find((s) => s.stock > 0) ?? product.sizes[0];
        color = !size
          ? (product.colors.find((c) => c.stock > 0) ?? product.colors[0])
          : undefined;
      }

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
              selected: true,
            },
          ],
        };
      });

      return {
        previous,
        input: {
          productId: product.id,
          productSizeId: size?.id ?? null,
          productColorId: color?.id ?? null,
          qty,
        },
      };
    },
    [patchCartOptimistically],
  );

  const addItem = useCallback(
    (product: Product, variantLabel: string | null = null, qty = 1) => {
      const { previous, input } = prepareAddItem(product, variantLabel, qty);
      addCartItem(input)
        .then(setCart)
        .catch(() => {
          if (previous) setCart(previous);
        });
    },
    [setCart, prepareAddItem],
  );

  const addItemBlocking = useCallback(
    (product: Product, variantLabel: string | null = null, qty = 1) => {
      const { previous, input } = prepareAddItem(product, variantLabel, qty);
      addItemMutation.mutate(input, {
        onSuccess: setCart,
        onError: () => {
          if (previous) setCart(previous);
        },
      });
    },
    [setCart, prepareAddItem, addItemMutation],
  );

  const removeItemMutation = useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: removeCartItem,
  });
  const removeItem = useCallback(
    async (cartItemId: string) => {
      const previous = patchCartOptimistically((current) => ({
        ...current,
        items: current.items.filter((i) => i.id !== cartItemId),
      }));

      try {
        const next = await removeItemMutation.mutateAsync(cartItemId);
        setCart(next);
        return next;
      } catch (err) {
        if (previous) setCart(previous);
        throw err;
      }
    },
    [setCart, patchCartOptimistically, removeItemMutation],
  );

  const moveToWishlistMutation = useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: moveCartItemsToWishlist,
  });
  const moveToWishlist = useCallback(
    async (itemIds: string[]) => {
      const previous = patchCartOptimistically((current) => ({
        ...current,
        items: current.items.filter((i) => !itemIds.includes(i.id)),
      }));

      try {
        const next = await moveToWishlistMutation.mutateAsync(itemIds);
        setCart(next);
        queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        return next;
      } catch (err) {
        if (previous) setCart(previous);
        throw err;
      }
    },
    [setCart, patchCartOptimistically, moveToWishlistMutation, queryClient],
  );

  const updateQtyMutation = useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      updateCartItem(id, { qty }),
  });
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
        updateQtyMutation.mutate(
          { id: cartItemId, qty },
          { onSuccess: setCart },
        );
      }, QTY_DEBOUNCE_MS);
      qtyTimers.current.set(cartItemId, timer);
    },
    [removeItem, setCart, patchCartOptimistically, updateQtyMutation],
  );

  const toggleSelectedMutation = useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: ({ id, selected }: { id: string; selected: boolean }) =>
      updateCartItem(id, { selected }),
  });
  const toggleSelected = useCallback(
    (cartItemId: string, selected: boolean) => {
      const previous = patchCartOptimistically((current) => ({
        ...current,
        items: current.items.map((i) =>
          i.id === cartItemId ? { ...i, selected } : i,
        ),
      }));

      toggleSelectedMutation.mutate(
        { id: cartItemId, selected },
        {
          onSuccess: setCart,
          onError: () => {
            if (previous) setCart(previous);
          },
        },
      );
    },
    [setCart, patchCartOptimistically, toggleSelectedMutation],
  );

  const toggleSelectAllMutation = useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: setAllCartItemsSelected,
  });
  const toggleSelectAll = useCallback(
    (selected: boolean) => {
      const previous = patchCartOptimistically((current) => ({
        ...current,
        items: current.items.map((i) => ({ ...i, selected })),
      }));

      toggleSelectAllMutation.mutate(selected, {
        onSuccess: setCart,
        onError: () => {
          if (previous) setCart(previous);
        },
      });
    },
    [setCart, patchCartOptimistically, toggleSelectAllMutation],
  );

  const clearMutation = useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: clearCartApi,
  });
  const clear = useCallback(() => {
    clearMutation.mutate(undefined, { onSuccess: setCart });
  }, [setCart, clearMutation]);

  const applyCouponMutation = useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: applyCartCoupon,
  });
  const applyCoupon = useCallback(
    async (code: string) => {
      const next = await applyCouponMutation.mutateAsync(code);
      setCart(next);
      return next;
    },
    [setCart, applyCouponMutation],
  );

  const removeCouponMutation = useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: removeCartCoupon,
  });
  const removeCoupon = useCallback(async () => {
    const next = await removeCouponMutation.mutateAsync();
    setCart(next);
    return next;
  }, [setCart, removeCouponMutation]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: cart?.items ?? [],
      addItem,
      addItemBlocking,
      removeItem,
      moveToWishlist,
      updateQty,
      toggleSelected,
      toggleSelectAll,
      clear,
      couponCode: cart?.couponCode ?? null,
      applyCoupon,
      removeCoupon,
      totals: cart?.totals ?? EMPTY_TOTALS,
      isLoading,
      isMutating,
    }),
    [
      cart,
      addItem,
      addItemBlocking,
      removeItem,
      moveToWishlist,
      updateQty,
      toggleSelected,
      toggleSelectAll,
      clear,
      applyCoupon,
      removeCoupon,
      isLoading,
      isMutating,
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
      addItemBlocking: () => {},
      removeItem: async () => ({}) as never,
      moveToWishlist: async () => ({}) as never,
      updateQty: () => {},
      toggleSelected: () => {},
      toggleSelectAll: () => {},
      clear: () => {},
      couponCode: null,
      applyCoupon: async () => ({}) as never,
      removeCoupon: async () => ({}) as never,
      totals: EMPTY_TOTALS,
      isLoading: false,
      isMutating: false,
    };
  }
  return ctx;
}

export const rupee = (n: number): string =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;
