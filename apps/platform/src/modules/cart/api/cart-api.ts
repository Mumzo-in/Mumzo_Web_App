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

export function fetchCart(pincode?: string | null): Promise<PublicCart> {
  const query = pincode ? `?pincode=${encodeURIComponent(pincode)}` : "";
  return apiRequest<PublicCart>(`/cart${query}`);
}

export function addCartItem(input: AddCartItemInput): Promise<PublicCart> {
  return apiRequest<PublicCart>("/cart/items", { method: "POST", body: input });
}

export function updateCartItem(id: string, qty: number): Promise<PublicCart> {
  return apiRequest<PublicCart>(`/cart/items/${id}`, {
    method: "PATCH",
    body: { qty },
  });
}

export function removeCartItem(id: string): Promise<PublicCart> {
  return apiRequest<PublicCart>(`/cart/items/${id}`, { method: "DELETE" });
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
