import { apiRequest } from "@/core/api/client";

export interface CartLine {
  id: string;
  productId: string;
  productSizeId: string | null;
  productColorId: string | null;
  name: string;
  brand: string;
  img: string | null;
  variantLabel: string | null;
  price: number;
  mrp: number;
  qty: number;
  stock: number;
  isOutOfStock: boolean;
  /** Whether this line counts toward totals/checkout — the cart's "select
   * items to buy" checkbox. */
  selected: boolean;
}

export interface CartTotals {
  subtotal: number;
  gstAmount: number;
  deliveryFee: number;
  discount: number;
  total: number;
  freeDeliveryThreshold: number;
}

export interface PublicCart {
  id: string;
  items: CartLine[];
  couponCode: string | null;
  totals: CartTotals;
}

export interface AddCartItemInput {
  productId: string;
  productSizeId?: string | null;
  productColorId?: string | null;
  qty?: number;
}

export interface CartLocation {
  pincode?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export function fetchCart(location: CartLocation = {}): Promise<PublicCart> {
  const params = new URLSearchParams();
  if (location.pincode) params.set("pincode", location.pincode);
  if (location.lat != null) params.set("lat", String(location.lat));
  if (location.lng != null) params.set("lng", String(location.lng));
  const query = params.toString();
  return apiRequest<PublicCart>(`/cart${query ? `?${query}` : ""}`);
}

export function addCartItem(input: AddCartItemInput): Promise<PublicCart> {
  return apiRequest<PublicCart>("/cart/items", { method: "POST", body: input });
}

export function updateCartItem(
  id: string,
  patch: { qty?: number; selected?: boolean },
): Promise<PublicCart> {
  return apiRequest<PublicCart>(`/cart/items/${id}`, {
    method: "PATCH",
    body: patch,
  });
}

/** Selects/deselects every line in one call — used by the "select all"
 * header checkbox instead of one PATCH per line. */
export function setAllCartItemsSelected(
  selected: boolean,
): Promise<PublicCart> {
  return apiRequest<PublicCart>("/cart/items", {
    method: "PATCH",
    body: { selected },
  });
}

export function removeCartItem(id: string): Promise<PublicCart> {
  return apiRequest<PublicCart>(`/cart/items/${id}`, { method: "DELETE" });
}

/** Wishlists each line's product and removes it from the cart, in one
 * request — used by "Move to wishlist" instead of looping a wishlist-add +
 * cart-delete call per item. Signed-in only. */
export function moveCartItemsToWishlist(
  itemIds: string[],
): Promise<PublicCart> {
  return apiRequest<PublicCart>("/cart/items/move-to-wishlist", {
    method: "POST",
    body: { itemIds },
  });
}

export function applyCartCoupon(code: string): Promise<PublicCart> {
  return apiRequest<PublicCart>("/cart/coupon", {
    method: "POST",
    body: { code },
  });
}

export function removeCartCoupon(): Promise<PublicCart> {
  return apiRequest<PublicCart>("/cart/coupon", { method: "DELETE" });
}

export function clearCartApi(): Promise<PublicCart> {
  return apiRequest<PublicCart>("/cart", { method: "DELETE" });
}

export function mergeCartApi(): Promise<PublicCart> {
  return apiRequest<PublicCart>("/cart/merge", { method: "POST" });
}
