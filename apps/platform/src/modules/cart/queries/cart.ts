import { queryOptions } from "@tanstack/react-query";
import { fetchCart } from "../api/cart-api";

export const cartQueryKey = (pincode?: string | null) =>
  ["cart", pincode ?? null] as const;

export const cartQueryOptions = (pincode?: string | null) =>
  queryOptions({
    queryKey: cartQueryKey(pincode),
    queryFn: () => fetchCart(pincode),
  });
