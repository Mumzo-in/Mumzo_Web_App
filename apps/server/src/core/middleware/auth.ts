import { adminAuth, platformAuth } from "@mumzo/auth";
import { createMiddleware } from "hono/factory";

import { unauthorized } from "@/core/errors";
import type { AppEnv } from "@/core/types";

/**
 * Session resolution is per-instance on purpose.
 *
 * `platformAuth` and `adminAuth` read different cookies backed by different
 * tables, so a customer token presented to an admin route resolves to
 * nothing. Never fall back from one to the other — that would undo the
 * isolation the separate tables exist to provide.
 */

/**
 * Hydrates `c.var.user` when a customer session cookie is present, but does
 * not reject. Use on public storefront routes that behave differently when
 * signed in (browsing, guest carts).
 */
export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  const session = await platformAuth.api.getSession({
    headers: c.req.raw.headers,
  });

  c.set("user", session?.user ?? null);

  await next();
});

/** Rejects anonymous requests on the customer surface. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const session = await platformAuth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    throw unauthorized();
  }

  c.set("user", session.user);

  await next();
});

/**
 * Rejects anonymous requests on the admin surface.
 *
 * Checks the staff instance only. A valid customer session is not a valid
 * staff session and must be rejected here.
 */
export const requireStaffAuth = createMiddleware<AppEnv>(async (c, next) => {
  const session = await adminAuth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    throw unauthorized();
  }

  c.set("user", session.user);

  await next();
});
