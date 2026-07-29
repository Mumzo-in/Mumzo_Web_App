import { apiRequest } from "@/core/api/client";

export function fetchWishlistIds(): Promise<string[]> {
  return apiRequest<string[]>("/wishlist");
}

export function addToWishlistApi(productId: string): Promise<{ ok: true }> {
  return apiRequest(`/wishlist/${productId}`, { method: "POST" });
}

export function removeFromWishlistApi(
  productId: string,
): Promise<{ ok: true }> {
  return apiRequest(`/wishlist/${productId}`, { method: "DELETE" });
}
