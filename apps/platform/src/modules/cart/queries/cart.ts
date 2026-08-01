import { queryOptions } from "@tanstack/react-query";
import { type CartLocation, fetchCart } from "../api/cart-api";

export const cartQueryKey = (location: CartLocation = {}) =>
  [
    "cart",
    location.pincode ?? null,
    location.lat ?? null,
    location.lng ?? null,
  ] as const;

export const cartQueryOptions = (location: CartLocation = {}) =>
  queryOptions({
    queryKey: cartQueryKey(location),
    queryFn: () => fetchCart(location),
  });
