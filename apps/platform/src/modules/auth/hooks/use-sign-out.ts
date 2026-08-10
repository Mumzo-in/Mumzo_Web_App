import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "../api/auth-client";

/** Query key roots that carry the signed-out-of user's data — cleared on
 * sign-out so the next session (guest browsing, or a different account on
 * the same device) never renders a stale cart/wishlist/address/order list
 * from the previous user before its own fetch resolves. */
const USER_SCOPED_QUERY_KEYS = [
  "cart",
  "wishlist",
  "addresses",
  "orders",
  "auth-session",
];

/**
 * Wraps `authClient.signOut` with cache cleanup — every call site should go
 * through this instead of calling `authClient.signOut` directly.
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  async function signOut(): Promise<boolean> {
    const result = await authClient.signOut();
    for (const key of USER_SCOPED_QUERY_KEYS) {
      queryClient.removeQueries({ queryKey: [key] });
    }
    return Boolean(result.data?.success);
  }

  return { signOut };
}
