import { queryOptions } from "@tanstack/react-query";
import { fetchWishlistIds } from "../api/wishlist-api";

export const wishlistQueryOptions = queryOptions({
  queryKey: ["wishlist"],
  queryFn: fetchWishlistIds,
});
