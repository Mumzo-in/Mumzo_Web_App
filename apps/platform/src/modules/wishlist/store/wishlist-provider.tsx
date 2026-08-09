import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { toast } from "sonner";

import { authClient, useRequireAuth } from "@/modules/auth";
import { addToWishlistApi, removeFromWishlistApi } from "../api/wishlist-api";
import { wishlistQueryOptions } from "../queries/wishlist";

interface WishlistContextValue {
  ids: string[];
  has: (id: string) => boolean;
  /** Signed out → opens the login modal (prompt included) and resumes this
   * exact toggle once sign-in succeeds, instead of silently no-op'ing. */
  toggle: (id: string) => void;
  remove: (id: string) => void;
  count: number;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Backed by `GET/POST/DELETE /api/v1/wishlist` — requires a signed-in
 * session (`requireAuth` server-side). Unlike `AddressProvider`, auth is
 * gated *inside* `toggle` itself (via `useRequireAuth`) rather than pushed
 * out to each call site — the heart icon on `ProductCard`/PDP has always
 * called `toggle(id)` unconditionally, and there are multiple such call
 * sites, so centralizing the "prompt login" behavior here means none of
 * them need to change.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { run: runIfAuthed } = useRequireAuth();
  const { data: ids = [], isLoading } = useQuery({
    ...wishlistQueryOptions,
    enabled: Boolean(session),
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
    [queryClient],
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const remove = useCallback(
    (id: string) => {
      void removeFromWishlistApi(id).then(() => invalidate());
    },
    [invalidate],
  );

  const toggle = useCallback(
    (id: string) => {
      runIfAuthed(() => {
        const wasWished = has(id);
        const action = wasWished
          ? removeFromWishlistApi(id)
          : addToWishlistApi(id);
        void action.then(async () => {
          await invalidate();
          toast.success(
            wasWished ? "Removed from wishlist" : "Saved to wishlist",
          );
        });
      }, "Sign in to save items to your wishlist.");
    },
    [runIfAuthed, has, invalidate],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({ ids, has, toggle, remove, count: ids.length, isLoading }),
    [ids, has, toggle, remove, isLoading],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

const DEFAULT_WISHLIST_VALUE: WishlistContextValue = {
  ids: [],
  has: () => false,
  toggle: () => {},
  remove: () => {},
  count: 0,
  isLoading: false,
};

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return DEFAULT_WISHLIST_VALUE;
  }
  return ctx;
}
