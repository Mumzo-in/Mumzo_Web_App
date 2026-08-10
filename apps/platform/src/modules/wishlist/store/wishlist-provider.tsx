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
  toggle: (id: string) => Promise<void>;
  add: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  count: number;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

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

  const add = useCallback(
    async (id: string) => {
      if (ids.includes(id)) return;
      queryClient.setQueryData<string[]>(["wishlist"], (old = []) =>
        old.includes(id) ? old : [...old, id],
      );
      try {
        await addToWishlistApi(id);
      } finally {
        await invalidate();
      }
    },
    [ids, queryClient, invalidate],
  );

  const remove = useCallback(
    async (id: string) => {
      queryClient.setQueryData<string[]>(["wishlist"], (old = []) =>
        old.filter((i) => i !== id),
      );
      try {
        await removeFromWishlistApi(id);
      } finally {
        await invalidate();
      }
    },
    [queryClient, invalidate],
  );

  const toggle = useCallback(
    (id: string): Promise<void> => {
      return new Promise((resolve) => {
        runIfAuthed(async () => {
          const wasWished = has(id);
          queryClient.setQueryData<string[]>(["wishlist"], (old = []) =>
            wasWished ? old.filter((i) => i !== id) : [...old, id],
          );
          try {
            if (wasWished) {
              await removeFromWishlistApi(id);
            } else {
              await addToWishlistApi(id);
            }
            toast.success(
              wasWished ? "Removed from wishlist" : "Saved to wishlist",
            );
          } finally {
            await invalidate();
          }
          resolve();
        }, "Sign in to save items to your wishlist.");
      });
    },
    [runIfAuthed, has, queryClient, invalidate],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({ ids, has, toggle, add, remove, count: ids.length, isLoading }),
    [ids, has, toggle, add, remove, isLoading],
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
  toggle: async () => {},
  add: async () => {},
  remove: async () => {},
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
