import { queryOptions } from "@tanstack/react-query";
import { fetchCart } from "../api/cart-api";

export const cartQueryOptions = queryOptions({
  queryKey: ["cart"],
  queryFn: fetchCart,
});
