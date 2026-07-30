import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";

import type { AppEnv } from "@/core/types";
import type { CartOwner } from "./cart.service";

const GUEST_COOKIE = "mumzo_guest_id";
/** 1 year — long enough that an infrequent shopper's guest cart survives
 * between visits, short of forever so stale ids don't accumulate forever. */
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Resolves who owns this request's cart. Signed-in customers always win
 * (their `userId` from `optionalAuth`); anonymous visitors get a
 * `mumzo_guest_id` cookie minted on first touch so their cart persists
 * across requests without an account.
 */
export function resolveCartOwner(c: Context<AppEnv>): CartOwner {
  const user = c.get("user");
  if (user) {
    return { userId: user.id, guestSessionId: null };
  }

  let guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) {
    guestId = crypto.randomUUID();
    setCookie(c, GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: GUEST_COOKIE_MAX_AGE,
      path: "/",
    });
  }
  return { userId: null, guestSessionId: guestId };
}

/** For `/cart/merge` — needs the guest id even though the request is now
 * authenticated, so it can't come from `resolveCartOwner` (which would
 * return the user branch). Returns null if there's no guest cart to merge. */
export function readGuestSessionId(c: Context<AppEnv>): string | null {
  return getCookie(c, GUEST_COOKIE) ?? null;
}
